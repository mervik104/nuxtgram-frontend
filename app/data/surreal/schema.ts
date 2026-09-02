import { edge, t, table } from 'surqlize'

// Схема базы Nuxtgram: таблицы (table) и рёбра (edge) для ORM surqlize.
// Из неё выводятся типы строк UserRow / MediaRow / PostRow / CommentRow,
// которые использует весь data-слой. Должна совпадать с миграцией
// database/surreal/001-infrastructure.surql.

// Допустимые реакции на посты и комментарии (значения enum-поля `type`).
const reactionType = t.union([
  t.literal('like'),
  t.literal('love'),
  t.literal('fire'),
  t.literal('haha'),
])

// Пользователи. clerkId привязывает запись к аккаунту Clerk (режим Sign-In),
// legacyId — legacy-ссылка со старой СУБД (миграции). avatar — RecordId на media.
export const users = table('users', {
  clerkId: t.option(t.string()),
  legacyId: t.option(t.string()),
  username: t.string(),
  nickname: t.string(),
  bio: t.option(t.string()),
  email: t.option(t.string()),
  avatar: t.option(t.record('media')),
  createdAt: t.date(),
  updatedAt: t.date(),
  last_seen_at: t.option(t.date()),
})

// Медиа-файлы (аватары и картинки постов). publicUrl — публичная ссылка
// на файл (после загрузки через media-worker), objectKey — ключ объекта R2.
// thumbnail/card — уменьшенные версии, генерируются при загрузке.
export const media = table('media', {
  legacyId: t.option(t.string()),
  owner: t.option(t.record('users')),
  objectKey: t.option(t.string()),
  publicUrl: t.string(),
  thumbnailObjectKey: t.option(t.string()),
  cardObjectKey: t.option(t.string()),
  filename: t.string(),
  alt: t.string(),
  mimeType: t.string(),
  size: t.number(),
  width: t.option(t.number()),
  height: t.option(t.number()),
  thumbnailWidth: t.option(t.number()),
  thumbnailHeight: t.option(t.number()),
  cardWidth: t.option(t.number()),
  cardHeight: t.option(t.number()),
  createdAt: t.date(),
  updatedAt: t.date(),
})

// Посты: текст + опциональные картинки (RecordId на media), автор обязателен.
export const posts = table('posts', {
  legacyId: t.option(t.string()),
  content: t.string(),
  author: t.record('users'),
  images: t.option(t.array(t.record('media'))),
  createdAt: t.date(),
  updatedAt: t.date(),
})

// Комментарии к постам: текст + автор + пост, которому принадлежат.
export const comments = table('comments', {
  legacyId: t.option(t.string()),
  content: t.string(),
  author: t.record('users'),
  post: t.record('posts'),
  images: t.option(t.array(t.record('media'))),
  createdAt: t.date(),
  updatedAt: t.date(),
})

// Ребро «юзер вступил в подписку на юзера» (out → in).
export const follows = edge('users', 'follows', 'users', {})

// Ребро «юзер поставил реакцию на пост» (out → in), с типом реакции.
export const postReactions = edge('users', 'post_reactions', 'posts', {
  type: reactionType,
})

// Ребро «юзер поставил реакцию на комментарий» (out → in), с типом реакции.
export const commentReactions = edge('users', 'comment_reactions', 'comments', {
  type: reactionType,
})

export const notifications = table('notifications', {
  recipient: t.record('users'),
  type: t.string(),
  actor: t.record('users'),
  entity_id: t.string(),
  post_id: t.option(t.string()),
  unread: t.union([t.literal(true), t.literal(false)]),
  created_at: t.date(),
})

// Выведенные типы строк таблиц — публичный контракт data-слоя.
export type UserRow = typeof users.type
export type MediaRow = typeof media.type
export type PostRow = typeof posts.type
export type CommentRow = typeof comments.type
