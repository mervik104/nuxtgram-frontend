import type { IComment } from "./comment.types.js"
import type { IPost } from "./post.types.js"
import type { IUser } from "./user.types.js"

export type ReactionType = 'like' | 'love' | 'haha' | 'fire' | null

export type ReactionsCount = {
  like: number
  love: number
  haha: number
  fire: number
}

export interface IReactionRequest {
  target: {
    relationTo: "posts" | "comments",
    value: string
  }
  type: ReactionType
}

export interface IReactionCreatedResponsePost {
  action: "created",
  doc: {
    author: IUser,
    createdAt: string,
    id: string,
    type: ReactionType,
    target: {
      relationTo: "posts",
      value: IPost
    }
  },
}

export interface IReactionDeletedResponse {
  action: "deleted",
  id: string
}

export interface IReactionCreatedResponseComment {
  action: "created",
  doc: {
    author: IUser,
    createdAt: string,
    id: string,
    type: ReactionType,
    target: {
      relationTo: "comments",
      value: IComment
    }
  },
}
