import type { IUser } from './user.types'

export type NotificationType = 'reaction' | 'follow' | 'comment' | 'mention' | 'message'

export interface INotification {
  id: string
  type: NotificationType
  actor: IUser
  entityId: string
  postId?: string
  unread: boolean
  createdAt: string
}
