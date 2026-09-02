import type { INotification, NotificationType } from '~/types/notification.types'
import type { UserRow } from './schema'
import type { NuxtgramDatabase } from './client'
import { recordIdFromString } from './ids'
import { toUser } from './mappers'

type NotificationRow = {
  id: unknown
  type: NotificationType
  actor?: UserRow
  entity_id: string
  post_id?: string
  unread: boolean
  created_at: unknown
}

export async function findNotifications(db: NuxtgramDatabase, recipientId: string): Promise<INotification[]> {
  const rows = await db.select('notifications')
    .where((notification) => notification.recipient.eq(recordIdFromString<'users'>(recipientId)))
    .fetch('actor')
    .orderBy('created_at', 'DESC')
    .limit(50) as unknown as NotificationRow[]

  return rows.map((row) => ({
    id: String(row.id),
    type: row.type,
    actor: toUser(row.actor!),
    entityId: row.entity_id,
    postId: row.post_id,
    unread: row.unread,
    createdAt: String(row.created_at),
  }))
}

export async function markNotificationRead(db: NuxtgramDatabase, id: string) {
  await db.update(recordIdFromString<'notifications'>(id)).merge({ unread: false })
}

export async function deleteNotification(db: NuxtgramDatabase, id: string) {
  await db.delete(recordIdFromString<'notifications'>(id))
}
