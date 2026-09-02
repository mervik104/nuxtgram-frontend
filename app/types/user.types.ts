import type { IPaginationMeta } from "./common.types"

export type UserSessionType = {
  id: string,
  createdAt: string,
  expiresAt: string
}

export type UserGetMeType = {
  user: {
    username: string
    nickname: string
    email: string
    sessions: UserSessionType[]
    id: string,
    avatar?: IAvatarType,
    bio?: string,
  }
  message: 'Account'
}

export type UserLoginType = {
  email: string,
  password: string,
}

export type UserRegisterType = {
  username: string,
  email: string,
  password: string,
}

export type UserResponseType = {
  username: string,
  nickname: string,
  email: string,
  password: string,
}

export interface IAvatarType {
  createdAt: string,
  updatedAt: string,
  alt: string,
  url: string,
  filename: string,
  mimeType: string,
  filesize: number,
  width: number,
  height: number,
  focalX: number,
  focalY: number,
  sizes: {
    thumbnail: {
      url: string,
      width: number,
      height: number,
      mimeType: string,
      filesize: number,
      filename: string
    },
    card: {
      url: null,
      width: null,
      height: null,
      mimeType: null,
      filesize: null,
      filename: null
    }
  },
  id: string,
  thumbnailURL: string
}

export interface IUser {
  username: string,
  nickname: string,
  email?: string,
  avatar?: IAvatarType,
  bio?: string,
  lastSeenAt?: string,
  id: string
}

export interface IUsersResponse extends IPaginationMeta {
  docs: IUser[]
}

export interface IUserEditProfileType {
  username: string,
  nickname: string,
  bio: string | undefined,
}

export interface IEditProfileResponse {
  message: string,
  user: IUser
}
