import type { IAvatarType, IUser } from '~/types/user.types'
import type { MediaRow, UserRow } from './schema'

// Преобразует строку media из БД в публичный тип аватара IAvatarType.
// Умеет работать и с гидратированным объектом MediaRow, и с RecordId.
// Обязательное поле — publicUrl; остальное подставляется дефолтами,
// чтобы UI не падал на частично заполненных записях.
export function toAvatar(value: UserRow['avatar']): IAvatarType | undefined {
  if (!value || typeof value !== 'object' || !('publicUrl' in value)) return undefined

  const media = value as unknown as Partial<MediaRow> & { id: unknown }
  if (typeof media.publicUrl !== 'string') return undefined

  const url = media.publicUrl
  return {
    id: String(media.id),
    alt: media.alt || '',
    url,
    thumbnailURL: url,
    filename: media.filename || '',
    mimeType: media.mimeType || '',
    filesize: media.size || 0,
    width: media.width || 0,
    height: media.height || 0,
    focalX: 0,
    focalY: 0,
    createdAt: String(media.createdAt || ''),
    updatedAt: String(media.updatedAt || ''),
    sizes: {
      thumbnail: {
        url,
        width: media.thumbnailWidth || 0,
        height: media.thumbnailHeight || 0,
        mimeType: media.mimeType || '',
        filesize: media.size || 0,
        filename: media.filename || '',
      },
      card: {
        url: null,
        width: null,
        height: null,
        mimeType: null,
        filesize: null,
        filename: null,
      },
    },
  }
}

// Преобразует строку users из БД в публичный тип IUser.
// Аватар проходит через toAvatar (вернёт undefined, если ссылки на media нет).
export function toUser(value: UserRow): IUser {
  return {
    id: String(value.id),
    username: value.username,
    nickname: value.nickname,
    bio: value.bio,
    email: value.email,
    avatar: toAvatar(value.avatar),
  }
}