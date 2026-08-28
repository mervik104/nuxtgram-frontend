import { count } from 'surqlize'
import type { IPost, IPostsResponse } from '~/types/post.types'
import type { MediaImage } from '~/types/common.types'
import { hydrateUserAvatar } from './avatars'
import type { NuxtgramDatabase } from './client'
import type { MediaRow, PostRow, UserRow } from './schema'
import { toUser } from './mappers'
import { recordIdFromString } from './ids'

// Пост после fetch('author'): автор — полная строка users.
type FetchedPost = Omit<PostRow, 'author'> & {
  author: UserRow
}

// Преобразует строку media в публичный тип MediaImage (или null без publicUrl).
function toMediaImage(value: MediaRow): MediaImage | null {
  if (!value.publicUrl) return null

  return {
    id: String(value.id),
    alt: value.alt,
    url: value.publicUrl,
    filename: value.filename,
    mimeType: value.mimeType,
    filesize: value.size,
    width: value.width || 0,
    height: value.height || 0,
    focalX: 0,
    focalY: 0,
    thumbnailURL: value.publicUrl,
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
    sizes: {
      thumbnail: {
        url: value.publicUrl,
        width: value.thumbnailWidth || 0,
        height: value.thumbnailHeight || 0,
        mimeType: value.mimeType,
        filesize: value.size,
        filename: value.filename,
      },
      card: {
        url: value.publicUrl,
        width: value.cardWidth || 0,
        height: value.cardHeight || 0,
        mimeType: value.mimeType,
        filesize: value.size,
        filename: value.filename,
      },
    },
  }
}

// Преобразует запись поста в публичный тип IPost (без счётчиков —
// заполняются гидрацией в hydratePost).
function toPost(value: FetchedPost, images: MediaRow[] = []): IPost {
  return {
    id: String(value.id),
    content: value.content,
    author: toUser(value.author),
    image: images.map(toMediaImage).filter((media): media is MediaImage => Boolean(media)),
    reactionsCount: { like: 0, love: 0, fire: 0, haha: 0 },
    commentsCount: 0,
    myReaction: null,
    createdAt: String(value.createdAt),
  }
}

// Превращает поле post.images (RecordId[] или строки) в массив строковых id вида `media:<id>`.
function toRecordIds(value: PostRow['images']): string[] {
  if (!value) return []
  return value.map((item) => {
    const raw = item as unknown
    if (typeof raw === 'object' && raw !== null && 'id' in raw) {
      const record = raw as { table?: unknown; id: unknown }
      const table = 'table' in record && record.table ? String(record.table) : 'media'
      return `${table}:${String(record.id)}`
    }
    const str = String(raw)
    return str.includes(':') ? str : `media:${str}`
  })
}

// Тянет пост по id с автором; аватар автора гидрачуется отдельным запросом.
async function fetchPostRow(db: NuxtgramDatabase, id: string): Promise<FetchedPost | undefined> {
  const rows = (await db
    .select(recordIdFromString<'posts'>(id))
    .fetch('author')) as unknown as FetchedPost[]

  // fetch('author') отдаёт UserRow, но avatar внутри — голый RecordId;
  // догидрачиваем аватары авторов (fetch('author.avatar') у surqlize не проходит).
  await hydrateUserAvatar(db, rows.map((row) => row.author))
  return rows[0]
}

// Догружает полные строки media для картинок поста (по RecordId из post.images).
async function fetchMedia(db: NuxtgramDatabase, post: FetchedPost): Promise<MediaRow[]> {
  const ids = toRecordIds(post.images)
  if (ids.length === 0) return []
  const rows = await db
    .select('media')
    .where((m) => m.id.inside(ids.map((i) => recordIdFromString<'media'>(i))))
  return rows as unknown as MediaRow[]
}

// Количество комментариев под постом.
async function countComments(db: NuxtgramDatabase, postId: string): Promise<number> {
  const rows = await db
    .select('comments')
    .where((comment) => comment.post.eq(recordIdFromString<'posts'>(postId)))
    .groupAll()
    .return((comment) => ({ total: count(comment) }))

  return Number((rows[0] as { total?: number } | undefined)?.total || 0)
}

// Число реакций на пост с разбивкой по типу (like/love/fire/haha).
async function getReactionCounts(db: NuxtgramDatabase, postId: string): Promise<Record<string, number>> {
  const rows = await db
    .select('post_reactions')
    .where((reaction) => reaction.out.eq(recordIdFromString<'posts'>(postId)))
    .return((reaction) => reaction.type)

  const counts: Record<string, number> = { like: 0, love: 0, fire: 0, haha: 0 }
  for (const row of rows as Array<'like' | 'love' | 'fire' | 'haha'>) {
    if (row in counts) counts[row] = (counts[row] ?? 0) + 1
  }
  return counts
}

// Моя реакция на пост (по clerkId) или null, если не авторизован / реакции нет.
async function getMyReaction(db: NuxtgramDatabase, postId: string, clerkId?: string): Promise<IPost['myReaction']> {
  if (!clerkId) return null

  const user = (await db
    .select('users')
    .where((candidate) => candidate.clerkId.eq(clerkId))
    .limit(1))[0]
  if (!user) return null

  const reaction = (await db
    .select('post_reactions')
    .where((candidate) => candidate.in.eq(user.id).and(candidate.out.eq(recordIdFromString<'posts'>(postId))))
    .limit(1))[0]

  return reaction?.type || null
}

// Собирает итоговый IPost: картинки + комментарии + реакции + моя реакция.
async function hydratePost(
  db: NuxtgramDatabase,
  row: FetchedPost,
  media: MediaRow[],
  clerkId?: string,
): Promise<IPost> {
  const post = toPost(row, media)
  const [commentsCount, reactionsCount, myReaction] = await Promise.all([
    countComments(db, post.id),
    getReactionCounts(db, post.id),
    getMyReaction(db, post.id, clerkId),
  ])
  post.commentsCount = commentsCount
  post.reactionsCount = reactionsCount as IPost['reactionsCount']
  post.myReaction = myReaction
  return post
}

// Постраничная выдача постов (новые сверху). Опционально фильтр authorId.
// Каждый пост обогащается картинками, счётчиками и моей реакцией.
export async function findPostsPage(
  db: NuxtgramDatabase,
  options: { authorId?: string; clerkId?: string; page: number; limit: number },
): Promise<IPostsResponse> {
  let query = db.select('posts')
  if (options.authorId) {
    query = query.where((post) => post.author.eq(recordIdFromString<'users'>(options.authorId!)))
  }

  const [rows, totalRows] = await Promise.all([
    query
      .orderBy('createdAt', 'DESC')
      .start((options.page - 1) * options.limit)
      .limit(options.limit)
      .fetch('author'),
    options.authorId
      ? db.select('posts').where((post) => post.author.eq(recordIdFromString<'users'>(options.authorId!))).groupAll().return((post) => ({ total: count(post) }))
      : db.select('posts').groupAll().return((post) => ({ total: count(post) })),
  ])

  const postRows = rows as unknown as FetchedPost[]
  // Аватары всех авторов на странице пачкой одним запросом media.
  await hydrateUserAvatar(db, postRows.map((row) => row.author))
  const mediaByPost = await Promise.all(postRows.map(async (row) => [row, await fetchMedia(db, row)] as const))
  const byId = new Map(mediaByPost.map(([row, media]) => [String(row.id), media]))
  const posts = postRows.map((row) => toPost(row, byId.get(String(row.id)) || []))
  await Promise.all(posts.map(async (post) => {
    const [commentsCount, reactionsCount, myReaction] = await Promise.all([
      countComments(db, post.id),
      getReactionCounts(db, post.id),
      getMyReaction(db, post.id, options.clerkId),
    ])
    post.commentsCount = commentsCount
    post.reactionsCount = reactionsCount as IPost['reactionsCount']
    post.myReaction = myReaction
  }))

  const totalDocs = Number((totalRows[0] as { total?: number } | undefined)?.total || 0)
  const totalPages = Math.ceil(totalDocs / options.limit)

  return {
    docs: posts,
    totalDocs,
    limit: options.limit,
    totalPages,
    page: options.page,
    pagingCounter: totalDocs === 0 ? 0 : (options.page - 1) * options.limit + 1,
    hasPrevPage: options.page > 1,
    hasNextPage: options.page < totalPages,
    prevPage: options.page > 1 ? options.page - 1 : null,
    nextPage: options.page < totalPages ? options.page + 1 : null,
  }
}

// Полный пост по id со всеми обогащениями (или undefined).
export async function findPostById(
  db: NuxtgramDatabase,
  postId: string,
  clerkId?: string,
): Promise<IPost | undefined> {
  const row = await fetchPostRow(db, postId)
  if (!row) return undefined

  const media = await fetchMedia(db, row)
  return hydratePost(db, row, media, clerkId)
}

// Создаёт пост: текст + опциональные картинки (по RecordId media).
// Вернёт готовый пост (без счётчиков) или undefined, если запись не создалась.
export async function createPost(
  db: NuxtgramDatabase,
  authorId: string,
  content: string,
  imageIds: string[] = [],
): Promise<IPost | undefined> {
  const created = await db
    .create('posts')
    .set({
      content,
      author: recordIdFromString<'users'>(authorId),
      images: imageIds.length > 0 ? imageIds.map((id) => recordIdFromString<'media'>(id)) : undefined,
    })
    .return('after')

  const entry = created[0]
  if (!entry) return undefined

  const row = await fetchPostRow(db, String(entry.id))
  if (!row) return undefined
  const media = await fetchMedia(db, row)
  return toPost(row, media)
}

// Обновляет текст поста, возвращает его полное актуальное состояние.
export async function updatePost(
  db: NuxtgramDatabase,
  postId: string,
  content: string,
  clerkId?: string,
): Promise<IPost | undefined> {
  const updated = await db
    .update(recordIdFromString<'posts'>(postId))
    .merge({ content })
    .return('after')

  const entry = updated[0]
  if (!entry) return undefined

  const row = await fetchPostRow(db, String(entry.id))
  if (!row) return undefined
  const media = await fetchMedia(db, row)
  return hydratePost(db, row, media, clerkId)
}

// Удаляет пост (саму запись) и возвращает её прежнее состояние для UI.
export async function deletePost(
  db: NuxtgramDatabase,
  postId: string,
): Promise<IPost | undefined> {
  const row = await fetchPostRow(db, postId)
  if (!row) return undefined

  await db.delete(recordIdFromString<'posts'>(postId)).return('none')
  const media = await fetchMedia(db, row)
  return toPost(row, media)
}

// Переключает реакцию на пост: создаёт, меняет тип или удаляет при совпадении.
// Возвращает {action: created|updated|deleted}. Конкурентный create ловит
// дубликат (уникальность out+in) и превращает в update.
export async function togglePostReaction(
  db: NuxtgramDatabase,
  userId: string,
  postId: string,
  type: 'like' | 'love' | 'fire' | 'haha',
) {
  const user = recordIdFromString<'users'>(userId)
  const post = recordIdFromString<'posts'>(postId)
  const existing = (await db
    .select('post_reactions')
    .where((reaction) => reaction.in.eq(user).and(reaction.out.eq(post)))
    .limit(1))[0]

  if (!existing) {
    try {
      const created = await db
        .relate('post_reactions', user, post)
        .set({ type })
        .return('after')
      return { action: 'created' as const, doc: created[0] }
    } catch (error) {
      const dup = (await db
        .select('post_reactions')
        .where((reaction) => reaction.in.eq(user).and(reaction.out.eq(post)))
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

  const updated = await db
    .update(existing.id)
    .merge({ type })
    .return('after')
  return { action: 'updated' as const, doc: updated[0] }
}