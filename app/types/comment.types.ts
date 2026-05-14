import type { IPaginationMeta } from "./common.types"
import type { IPost } from "./post.types"
import type { ReactionsCount, ReactionType } from "./reaction.types"
import type { IUser } from "./user.types"

export interface IComment {
  id: string
  content: string
  author: IUser
  reactionsCount: ReactionsCount
  post: IPost
  myReaction: ReactionType
  createdAt: string
}

export interface ICommentResponse {
  doc: IComment
  message: string,
}

export interface ICommentsResponse extends IPaginationMeta {
  docs: IComment[],
}

export interface ICommentsRequest {
  page?: number
  limit?: number
  userId?: string
}
