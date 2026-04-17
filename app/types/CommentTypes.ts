import type { IPaginationMeta } from "./CommonTypes"
import type { IPost } from "./PostTypes"
import type { ReactionsCount, ReactionType } from "./ReactionTypes"
import type { IUser } from "./UserTypes"

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
