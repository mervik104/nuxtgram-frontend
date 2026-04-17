import type { IPaginationMeta } from "./CommonTypes"
import type { ReactionsCount, ReactionType } from "./ReactionTypes"
import type { IUser } from "./UserTypes"

export interface IPost {
  id: string
  content: string
  author: IUser
  reactionsCount: ReactionsCount
  commentsCount: number
  myReaction: ReactionType
  createdAt: string
}

export interface IPostResponse {
  doc: IPost
  message: string,
}

export interface IPostsResponse extends IPaginationMeta {
  docs: IPost[]
}

export interface IPostsRequest {
  page?: number
  limit?: number
  userId?: string
}

export interface ICreatePostRequest {
  content: string
}

export interface ICreateCommentRequest {
  post: string
  content: string
}