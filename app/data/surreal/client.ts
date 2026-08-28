import { Surreal } from 'surrealdb'
import { orm } from 'surqlize'
import {
  commentReactions,
  comments,
  follows,
  media,
  postReactions,
  posts,
  users,
} from './schema'

// Создаёт ORM-обёртку surqlize над уже подключённой сессией Surreal.
// Набор таблиц и рёбер здесь должен совпадать со схемой в ./schema
// (users, media, posts, comments, follows, post_reactions, comment_reactions).
export const createNuxtgramDatabase = (session: Surreal) =>
  orm(
    session,
    users,
    media,
    posts,
    comments,
    follows,
    postReactions,
    commentReactions,
  )

// Тип ORM-базы: переиспользуется в data-слое и в realtime-подписках,
// чтобы код видел типизированные методы select/create/update/relate.
export type NuxtgramDatabase = ReturnType<typeof createNuxtgramDatabase>