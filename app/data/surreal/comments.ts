import { count } from 'surqlize'
import type { IComment, ICommentsResponse } from '~/types/comment.types'
import type { IPost } from '~/types/post.types'
import { hydrateUserAvatar } from './avatars'
import type { NuxtgramDatabase } from './client'
import type { CommentRow, PostRow, UserRow } from './schema'
import { toUser } from './mappers'
import { recordIdFromString } from './ids'

// Комментарий после fetch('author','post'): автор и пост — полные строки БД.
type FetchedComment = Omit<CommentRow, 'author' | 'post'> & {
  author: UserRow
  post: PostRow
}

// Служебное преобразование записи поста в публичный тип IPost (без счётчиков —
// они подставляются позже). Используется внутри IComment для поля «комментарий → пост».
function toPost(value: PostRow, postAuthor: UserRow | undefined): IPost {
  return {
    id: String(value.id),
    content: value.content,
    author: postAuthor ? toUser(postAuthor) : {
      id: '',
      username: '',
      nickname: '',
    },
    image: [],
    reactionsCount: { like: 0, love: 0, fire: 0, haha: 0 },
    commentsCount: 0,
    myReaction: null,
    createdAt: String(value.createdAt),
  }
}

// Преобразует строку комментария в публичный тип IComment.
// Внутрь вложен пост через toPost (с автором поста для аватара).
function toComment(value: FetchedComment, postAuthor: UserRow | undefined): IComment {
  return {
    id: String(value.id),
    content: value.content,
    author: toUser(value.author),
    post: toPost(value.post, postAuthor),
    reactionsCount: { like: 0, love: 0, fire: 0, haha: 0 },
    myReaction: null,
    createdAt: String(value.createdAt),
  }
}

// Тянет комментарий по id с автором и постом, гидрачу аватары обоих юзеров.
async function fetchCommentRow(db: NuxtgramDatabase, id: string): Promise<FetchedComment | undefined> {
  const rows = (await db
    .select(recordIdFromString<'comments'>(id))
    .fetch('author', 'post')) as unknown as FetchedComment[]

  // Гидрация аватаров: автора комментария и автора поста (оба приходят с RecordId-avatar).
  await hydrateUserAvatar(db, rows.flatMap((row) => [row.author, row.post?.author].filter(Boolean)))
  return rows[0]
}

// Достаёт полную строку автора поста по RecordId из post.author.
// Нужно, чтобы вложенный в комментарий пост имел корректного автора (и аватар).
async function fetchPostAuthor(db: NuxtgramDatabase, post: Pick<PostRow, 'author'>): Promise<UserRow | undefined> {
  const raw = post.author as unknown
  let authorId = ''
  if (raw && typeof raw === 'object' && 'id' in raw) {
    const record = raw as { table?: unknown; id: unknown }
    const table = 'table' in record && record.table ? String(record.table) : 'users'
    authorId = `${table}:${String(record.id)}`
  } else if (raw) {
    authorId = String(raw)
  }
  if (!authorId || !authorId.includes(':')) return undefined

  const rows = (await db
    .select('users')
    .where((user) => user.id.eq(recordIdFromString<'users'>(authorId)))
    .limit(1)) as unknown as UserRow[]
  if (!rows[0]) return undefined

  await hydrateUserAvatar(db, rows)
  return rows[0]
}

// Считает реакции на комментарий по типу (like/love/fire/haha).
async function reactionCounts(db: NuxtgramDatabase, commentId: string): Promise<IComment['reactionsCount']> {
  const rows = await db
    .select('comment_reactions')
    .where((reaction) => reaction.out.eq(recordIdFromString<'comments'>(commentId)))
    .return((reaction) => reaction.type)

  const result: IComment['reactionsCount'] = { like: 0, love: 0, fire: 0, haha: 0 }
  for (const row of rows as Array<'like' | 'love' | 'fire' | 'haha'>) {
    if (row in result) result[row as keyof typeof result] += 1
  }
  return result
}

// Реакция текущего юзера на комментарий (по clerkId) или null, если не авторизован.
async function myReaction(db: NuxtgramDatabase, commentId: string, clerkId?: string): Promise<IComment['myReaction']> {
  if (!clerkId) return null

  const user = (await db
    .select('users')
    .where((candidate) => candidate.clerkId.eq(clerkId))
    .limit(1))[0]
  if (!user) return null

  const reaction = (await db
    .select('comment_reactions')
    .where((candidate) => candidate.in.eq(user.id).and(candidate.out.eq(recordIdFromString<'comments'>(commentId))))
    .limit(1))[0]

  return reaction?.type || null
}

// Постраничная выдача комментариев поста (свежие сверху, страница с page=1).
// Каждый комментарий обогащается счётчиками реакций и моей реакцией.
export async function findCommentsPage(
  db: NuxtgramDatabase,
  postId: string,
  clerkId: string | undefined,
  page: number,
  limit: number,
): Promise<ICommentsResponse> {
  const [rows, totalRows] = await Promise.all([
    db
      .select('comments')
      .where((comment) => comment.post.eq(recordIdFromString<'posts'>(postId)))
      .orderBy('createdAt', 'DESC')
      .start((page - 1) * limit)
      .limit(limit)
      .fetch('author', 'post'),
    db
      .select('comments')
      .where((comment) => comment.post.eq(recordIdFromString<'posts'>(postId)))
      .groupAll()
      .return((comment) => ({ total: count(comment) })),
  ])

  const commentRows = rows as unknown as FetchedComment[]
  await hydrateUserAvatar(db, commentRows.flatMap((row) => [row.author, row.post?.author].filter(Boolean)))

  const comments = await Promise.all(commentRows.map(async (row) => {
    const postAuthor = await fetchPostAuthor(db, row.post)
    const comment = toComment(row, postAuthor)
    comment.reactionsCount = await reactionCounts(db, comment.id)
    comment.myReaction = await myReaction(db, comment.id, clerkId)
    return comment
  }))

  const totalDocs = Number((totalRows[0] as { total?: number } | undefined)?.total || 0)
  const totalPages = Math.ceil(totalDocs / limit)
  return {
    docs: comments,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter: totalDocs === 0 ? 0 : (page - 1) * limit + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  }
}

// Создаёт комментарий к посту и возвращает его целиком (с автором/счётчиками).
export async function createComment(
  db: NuxtgramDatabase,
  authorId: string,
  postId: string,
  content: string,
): Promise<IComment | undefined> {
  const created = await db
    .create('comments')
    .set({
      content,
      author: recordIdFromString<'users'>(authorId),
      post: recordIdFromString<'posts'>(postId),
      images: undefined,
    })
    .return('after')

  const entry = created[0]
  if (!entry) return undefined

  const row = await fetchCommentRow(db, String(entry.id))
  if (!row) return undefined
  const postAuthor = await fetchPostAuthor(db, row.post)
  return toComment(row, postAuthor)
}

// Обновляет текст комментария и возвращает его свежее состояние.
export async function updateComment(
  db: NuxtgramDatabase,
  commentId: string,
  content: string,
  clerkId?: string,
): Promise<IComment | undefined> {
  const updated = await db
    .update(recordIdFromString<'comments'>(commentId))
    .merge({ content })
    .return('after')

  const entry = updated[0]
  if (!entry) return undefined
  return findCommentById(db, commentId, clerkId)
}

// Полноценная загрузка одного комментария со всеми обогащениями
// (используется после create/update для возврата актуального состояния).
async function findCommentById(db: NuxtgramDatabase, commentId: string, clerkId?: string): Promise<IComment | undefined> {
  const row = await fetchCommentRow(db, commentId)
  if (!row) return undefined
  const postAuthor = await fetchPostAuthor(db, row.post)
  const comment = toComment(row, postAuthor)
  comment.reactionsCount = await reactionCounts(db, comment.id)
  comment.myReaction = await myReaction(db, comment.id, clerkId)
  return comment
}

// Удаляет комментарий и возвращает его прежнее состояние (для UI/анимации).
export async function deleteComment(db: NuxtgramDatabase, commentId: string): Promise<IComment | undefined> {
  const row = await fetchCommentRow(db, commentId)
  if (!row) return undefined
  const postAuthor = await fetchPostAuthor(db, row.post)
  const comment = toComment(row, postAuthor)

  await db.delete(recordIdFromString<'comments'>(commentId)).return('none')
  return comment
}

// Переключает реакцию на комментарии: меняет тип, удаляет при совпадении типа,
// создаёт при отсутствии. Возвращает {action: created|updated|deleted}.
// Конкурентный create ловит дубликат и превращает в update.
export async function toggleCommentReaction(
  db: NuxtgramDatabase,
  userId: string,
  commentId: string,
  type: 'like' | 'love' | 'fire' | 'haha',
) {
  const user = recordIdFromString<'users'>(userId)
  const comment = recordIdFromString<'comments'>(commentId)
  const existing = (await db
    .select('comment_reactions')
    .where((reaction) => reaction.in.eq(user).and(reaction.out.eq(comment)))
    .limit(1))[0]

  if (!existing) {
    try {
      const created = await db.relate('comment_reactions', user, comment).set({ type }).return('after')
      return { action: 'created' as const, doc: created[0] }
    } catch (error) {
      const dup = (await db
        .select('comment_reactions')
        .where((reaction) => reaction.in.eq(user).and(reaction.out.eq(comment)))
        .limit(1))[0]
      if (dup) {
        await db.update(dup.id).merge({ type }).return('after')
        return { action: 'updated' as const, doc: dup }
      }
      throw error
    }
  }

  if (existing.type === type) {
    await db.delete(existing.id).return('none')
    return { action: 'deleted' as const, id: String(existing.id) }
  }

  const updated = await db.update(existing.id).merge({ type }).return('after')
  return { action: 'updated' as const, doc: updated[0] }
}