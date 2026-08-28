import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { generateKeyPairSync, createSign } from 'node:crypto'

import { Surreal } from 'surrealdb'
import { createNuxtgramDatabase } from '../app/data/surreal/client'
import {
  createPost,
  deletePost,
  findPostById,
  findPostsPage,
  togglePostReaction,
  updatePost,
} from '../app/data/surreal/posts'
import {
  createComment,
  deleteComment,
  findCommentsPage,
  toggleCommentReaction,
  updateComment,
} from '../app/data/surreal/comments'
import {
  findUserFollows,
  followUser,
  unfollowUser,
} from '../app/data/surreal/follows'

// E2E-проверка data-слоя на запущенном локально docker SurrealDB
// (http://127.0.0.1:8000, root/root, ns/db main/main).
//
// Прогоняет реальные операции поверх реальной БД: CRUD постов/комментариев,
// реакции, подписки, каскадные удаления и — в конце — аутентификацию
// record-юзеров через Clerk-подобный JWT (DEFINE ACCESS) вместе с проверкой
// прав и редактированием полей.
//
// ВАЖНО: скрипт ПЕРЕЗАПИСЫВАЕТ access clerk (на своём RS256 ключе e2e),
// а в конце восстанавливает прод-форму из 001-infrastructure.surql.

const here = dirname(fileURLToPath(import.meta.url))
const surqlPath = join(here, '..', 'database', 'surreal', '001-infrastructure.surql')

const URL = 'http://127.0.0.1:8000'
const NAMESPACE = 'main'
const DATABASE = 'main'

let passed = 0
let failed = 0

// Мини-ассерт: инкрементит счётчики и печатает OK/FAIL с деталями.
function check(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  OK  ${name}`)
  } else {
    failed++
    console.error(`  FAIL ${name} ${JSON.stringify(detail)}`)
  }
}

// Разбивает SQL-файл на отдельные стейтменты (уважает кавычки, скобки и '--'
// комментарии) — применяем по одному из-за лимитов query() в local-режиме.
function splitStatements(sql) {
  const out = []
  let current = ''
  let inDq = false
  let inSq = false
  let depth = 0
  let atLineStart = true
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (atLineStart && ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }
    const next = sql[i + 1]
    if (!inDq && !inSq && ch === '\\' && next === '"') {
      current += ch + next
      i++
      continue
    }
    if (!inSq && ch === '"' && (i === 0 || sql[i - 1] !== '\\')) inDq = !inDq
    if (!inDq && ch === "'" && (i === 0 || sql[i - 1] !== '\\')) inSq = !inSq
    if (!inDq && !inSq) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === ';' && depth === 0) {
        const trimmed = current.trim()
        if (trimmed && !trimmed.startsWith('--')) out.push(trimmed)
        current = ''
        continue
      }
    }
    current += ch
    atLineStart = ch === '\n'
  }
  const trimmed = current.trim()
  if (trimmed && !trimmed.startsWith('--')) out.push(trimmed)
  return out
}

// Выполняет весь SQL пачкой: каждый стейтмент отдельным запросом,
// собирает результаты; при первой же ошибке (status ERR) бросает Error
// с деталями всех упавших стейтментов.
async function queryAll(session, sql) {
  const resultsets = []
  for (const statement of splitStatements(sql)) {
    const res = await session.query(statement)
    const items = Array.isArray(res) ? res : [res]
    const errors = items.filter((r) => r && r.status === 'ERR')
    if (errors.length > 0) throw new Error(errors.map((e) => e.detail).join('\n'))
    resultsets.push(...items.map((r) => (r && r.status === 'OK' ? r.result : r)))
  }
  return resultsets
}

const session = new Surreal()
try {
  await session.connect(URL, {
    namespace: NAMESPACE,
    database: DATABASE,
    authentication: { username: 'root', password: 'root' },
  })
} catch (error) {
  console.error('Connection failed:', error.message)
  process.exit(1)
}
console.log('connected as root')

const db = createNuxtgramDatabase(session)

const infra = readFileSync(surqlPath, 'utf8')
await queryAll(session, infra)
console.log('001-infrastructure.surql applied')

await queryAll(session, `
  DELETE users;
  DELETE posts;
  DELETE comments;
  DELETE media;
  DELETE follows;
  DELETE post_reactions;
  DELETE comment_reactions;
  CREATE users:u1 SET username = 'alice', nickname = 'alice', clerkId = 'clerk_1', bio = 'hi';
  CREATE users:u2 SET username = 'bob', nickname = 'bob', clerkId = 'clerk_2';
  CREATE media:m1 SET owner = users:u1, objectKey = 'k1', publicUrl = 'https://cdn.example/x.jpg', filename = 'x.jpg', alt = 'a photo', mimeType = 'image/jpeg', size = 100;
`)
console.log('seeded users u1 (alice), u2 (bob), media:m1')

// ---- posts ----
const created = await createPost(db, 'users:u1', 'hello world', ['media:m1'])
check('createPost returns IPost with image', !!created?.id && created.image?.length === 1 && created.author.username === 'alice', created)
if (!created?.id) {
  console.log('aborting: createPost failed')
  process.exit(1)
}
const postId = created.id
check('createPost image mapped', created.image?.[0]?.url.includes('x.jpg'), created.image?.[0])

const page = await findPostsPage(db, { page: 1, limit: 10 })
check('findPostsPage.totalDocs === 1', page.totalDocs === 1 && page.docs.length === 1, page)
check('findPostsPage author + image resolved', page.docs[0]?.author.username === 'alice' && page.docs[0]?.image?.length === 1, page.docs[0])

const byId = await findPostById(db, postId)
check('findPostById returns post', byId?.content === 'hello world' && byId?.author.username === 'alice', byId)

const updated = await updatePost(db, postId, 'updated content')
check('updatePost changed content', updated?.content === 'updated content', updated)

const r1 = await togglePostReaction(db, 'users:u1', postId, 'like')
check('toggle: created', r1.action === 'created', r1)
const r2 = await togglePostReaction(db, 'users:u1', postId, 'love')
check('toggle: updated', r2.action === 'updated' && r2.doc?.type === 'love', r2)
const r3 = await togglePostReaction(db, 'users:u1', postId, 'love')
check('toggle: deleted', r3.action === 'deleted', r3)
const r4 = await togglePostReaction(db, 'users:u1', postId, 'fire')
check('toggle: created again', r4.action === 'created', r4)
const pageAfter = await findPostsPage(db, { page: 1, limit: 10, clerkId: 'clerk_1' })
check('reactionsCount fire === 1 + myReaction === fire', pageAfter.docs[0]?.reactionsCount.fire === 1 && pageAfter.docs[0]?.myReaction === 'fire', pageAfter.docs[0]?.reactionsCount)

// ---- comments ----
const comment = await createComment(db, 'users:u1', postId, 'first!')
check('createComment returns IComment', !!comment?.id && comment.author.username === 'alice', comment)
const commentId = comment?.id
if (!commentId) process.exit(1)
check('comment post.author resolved', comment.post?.author?.username === 'alice', comment.post)

const commentsPage = await findCommentsPage(db, postId, 'clerk_1', 1, 10)
check('findCommentsPage totalDocs === 1', commentsPage.totalDocs === 1 && commentsPage.docs.length === 1, commentsPage)
check('findCommentsPage post.author + myReaction', commentsPage.docs[0]?.post?.author?.username === 'alice' && commentsPage.docs[0]?.myReaction === null, commentsPage.docs[0])

const updatedComment = await updateComment(db, commentId, 'updated!')
check('updateComment changed content', updatedComment?.content === 'updated!', updatedComment)

const cr1 = await toggleCommentReaction(db, 'users:u1', commentId, 'haha')
check('comment reaction created', cr1.action === 'created' && cr1.doc?.type === 'haha', cr1)

const deletedComment = await deleteComment(db, commentId)
check('deleteComment returns pre-delete comment', deletedComment?.content === 'updated!', deletedComment)

let leftComments = (await queryAll(session, `SELECT count() FROM comments GROUP ALL;`))[0]
check('comment deleted', Number(leftComments[0]?.count) === 0, leftComments)
let leftCReactions = (await queryAll(session, `SELECT count() FROM comment_reactions GROUP ALL;`))[0]
check('comment_reactions cascade on comment delete', Number(leftCReactions[0]?.count) === 0, leftCReactions)

// ---- post delete cascades ----
await createComment(db, 'users:u2', postId, 'second!')
let pr = (await queryAll(session, `SELECT count() FROM post_reactions GROUP ALL;`))[0]
check('post_reactions present before post delete', Number(pr[0]?.count) === 1, pr)

const deletedPost = await deletePost(db, postId)
check('deletePost returns pre-delete post', deletedPost?.content === 'updated content', deletedPost)

let postsLeft = (await queryAll(session, `SELECT count() FROM posts GROUP ALL;`))[0]
check('post deleted', Number(postsLeft[0]?.count) === 0, postsLeft)
let commentsLeft = (await queryAll(session, `SELECT count() FROM comments GROUP ALL;`))[0]
check('comments cascade on post delete', Number(commentsLeft[0]?.count) === 0, commentsLeft)
let postReactionsLeft = (await queryAll(session, `SELECT count() FROM post_reactions GROUP ALL;`))[0]
check('post_reactions cascade on post delete', Number(postReactionsLeft[0]?.count) === 0, postReactionsLeft)

// ---- follows ----
await followUser(db, 'users:u1', 'users:u2')
await followUser(db, 'users:u2', 'users:u1')

const f1 = await findUserFollows(db, 'users:u1', 'users:u2')
check('followersCount === 1', f1.followersCount === 1, f1)
check('followingCount === 1', f1.followingCount === 1, f1)
check('isFollowing === true', f1.isFollowing === true, f1)
check('followers resolved', f1.followers[0]?.username === 'bob', f1.followers[0])

let dupErr = null
try {
  await followUser(db, 'users:u1', 'users:u2')
} catch (e) {
  dupErr = e
}
check('duplicate follow rejected', !!dupErr, String(dupErr))

await unfollowUser(db, 'users:u1', 'users:u2')
const f2 = await findUserFollows(db, 'users:u1', 'users:u2')
check('followingCount === 0 after unfollow', f2.followingCount === 0 && f2.followersCount === 1, f2)
const mirror = await findUserFollows(db, 'users:u2', 'users:u1')
check('isFollowing false for removed edge only', mirror.isFollowing === false, mirror)

let notFollowingErr = null
try {
  await unfollowUser(db, 'users:u1', 'users:u2')
} catch (e) {
  notFollowingErr = e
}
check('unfollow when not following throws', typeof notFollowingErr?.message === 'string', String(notFollowingErr))

// ---- record-user authentication and permissions (STEP 11) ----
const ISS = 'https://superb-marmot-2888.clerk.accounts.dev'
const AUD = 'nuxtgram-surrealdb'
const now = Math.floor(Date.now() / 1e3)

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicPem = publicKey.export({ type: 'spki', format: 'pem' })

const b64url = (buf) => Buffer.from(buf).toString('base64url')
// Подписывает JWT локальной RS256-парой (kid=e2e) — чтобы проверить вход
// record-юзера по DEFINE ACCESS с нашим собственным ключом.
const signJwt = (payload) => {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'e2e' }
  const h = b64url(JSON.stringify(header))
  const p = b64url(JSON.stringify(payload))
  const signature = createSign('RSA-SHA256').update(`${h}.${p}`).sign(privateKey)
  return `${h}.${p}.${b64url(signature)}`
}

await session.query(
  `
  DEFINE ACCESS OVERWRITE clerk ON DATABASE TYPE RECORD WITH JWT
    ALGORITHM RS256 KEY $pub
    AUTHENTICATE {
      IF $token.iss != "${ISS}" { THROW "Invalid Clerk issuer"; };
      IF $token.aud != "${AUD}" { THROW "Invalid Clerk audience"; };
      RETURN SELECT VALUE id FROM users WHERE clerkId = $token.sub LIMIT 1;
    };
  `,
  { pub: publicPem },
)
console.log('clerk access redefined on local RS256 key for record-user checks')

const claims = { iss: ISS, aud: AUD, iat: now, exp: now + 300, sub: 'clerk_1' }

const recordUser = new Surreal()
await recordUser.connect(URL, { namespace: NAMESPACE, database: DATABASE })
let authErr = null
try {
  await recordUser.authenticate(signJwt({ ...claims, ac: 'clerk', ns: 'main', db: 'main' }))
} catch (e) {
  authErr = e
}
check('record user authenticates with ac/ns/db claims', !authErr, String(authErr))

const anonErr = await (async () => {
  const anonSession = new Surreal()
  await anonSession.connect(URL, { namespace: NAMESPACE, database: DATABASE })
  try {
    await anonSession.authenticate(signJwt(claims))
    return null
  } catch (e) {
    return e
  }
})()
check('Clerk-like JWT without ac/ns/db claims is rejected', anonErr !== null, String(anonErr))

await queryAll(session, `
  CREATE users:u3 SET username = 'carol', nickname = 'carol', clerkId = 'clerk_3', email = 'carol@example.com';
  CREATE posts:p2 SET content = 'bob post', author = users:u2;
`)

const recordDb = createNuxtgramDatabase(recordUser)
const selfLookup = (await recordDb
  .select('users')
  .where((user) => user.clerkId.eq('clerk_1'))
  .limit(1))[0]
check('record user resolves own profile by clerkId', selfLookup?.id?.toString() === 'users:u1', selfLookup)

const otherLookup = (await recordDb
  .select('users')
  .where((user) => user.clerkId.eq('clerk_2'))
  .limit(1))[0]
check('record user can look up any clerkId (read ok, write still blocked)', otherLookup?.id?.toString() === 'users:u2', otherLookup)

const perms = [
  ['user: update other user denied', `UPDATE users:u2 SET bio = 'x';`],
  ['post: update other author denied', `UPDATE posts:p2 SET content = 'hacked';`],
  ['post: delete other author denied', `DELETE posts:p2;`],
  ['follow: self-follow denied', `RELATE users:u1->follows->users:u1;`],
  ['media: create denied', `CREATE media:z2 SET owner = users:u1, objectKey = 'k', publicUrl = 'u', filename = 'f', alt = 'a', mimeType = 'image/jpeg', size = 1;`],
]
for (const [name, sql] of perms) {
  const result = (await recordUser.query(sql))[0] ?? null
  check(name, Array.isArray(result) && result.length === 0, result)
}

const emailOther = (await recordUser.query(`SELECT email FROM users:u3;`))[0]
check('user: email of other redacted', Array.isArray(emailOther) && emailOther.every((row) => row.email === undefined), emailOther)

const ownUpdate = (await recordUser.query(`UPDATE users:u1 SET bio = 'cyber';`))[0]
check('user: own update allowed', Array.isArray(ownUpdate) && ownUpdate.length === 1 && ownUpdate[0]?.bio === 'cyber', ownUpdate)

const ownPost = (await recordUser.query(`CREATE posts:rec SET content = 'from record user', author = users:u1;`))[0]
check('post: create as self allowed', Array.isArray(ownPost) && ownPost.length === 1 && String(ownPost[0]?.author) === 'users:u1', ownPost)

const otherFollow = (await recordUser.query(`RELATE users:u1->follows->users:u2;`))[0]
check('follow: follow other user allowed', Array.isArray(otherFollow) && otherFollow.length === 1 && String(otherFollow[0]?.out) === 'users:u2', otherFollow)

const clerkField = (await recordUser.query(`SELECT id, clerkId FROM users:u1;`))[0]
check('user: own clerkId readable after fix', Array.isArray(clerkField) && clerkField.length === 1 && clerkField[0]?.clerkId === 'clerk_1', clerkField)

await recordUser.close()

const infraAccess = splitStatements(infra).find((s) => s.startsWith('DEFINE ACCESS OVERWRITE clerk'))
await queryAll(session, infraAccess)
console.log('clerk access restored to production form')

await session.close()
console.log(`\nRESULT: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)