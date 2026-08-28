import { describe, expect, test } from 'bun:test'
import { toAvatar, toUser } from '../app/data/surreal/mappers'

const media = {
  id: 'media:m1',
  publicUrl: 'https://cdn.example.com/media/img.png',
  alt: 'avatar',
  filename: 'img.png',
  mimeType: 'image/png',
  size: 1234,
  width: 100,
  height: 100,
  thumbnailWidth: 50,
  thumbnailHeight: 50,
  createdAt: '2026-08-27T10:00:00Z',
  updatedAt: '2026-08-27T10:00:00Z',
}

describe('toAvatar', () => {
  // Проверка: отсутствие аватара (undefined/null/строка-RecordId) → undefined.
  test('returns undefined when avatar is null/undefined/not-an-object', () => {
    expect(toAvatar(undefined)).toBeUndefined()
    expect(toAvatar(null as never)).toBeUndefined()
    expect(toAvatar('media:m1' as never)).toBeUndefined()
  })

  // Проверка: объект media без publicUrl (скрытое поле) → undefined.
  test('returns undefined when publicUrl is missing (redacted field)', () => {
    expect(toAvatar({ id: 'media:m1' } as never)).toBeUndefined()
    expect(toAvatar({ id: 'media:m1', publicUrl: undefined } as never)).toBeUndefined()
  })

  // Проверка: полный объект media маппится в IAvatarType (включая sizes.
  // thumbnail/card, url, mimeType).
  test('maps a full media object to IAvatarType', () => {
    const result = toAvatar(media as never)
    expect(result?.id).toBe('media:m1')
    expect(result?.url).toBe('https://cdn.example.com/media/img.png')
    expect(result?.mimeType).toBe('image/png')
    expect(result?.sizes?.thumbnail?.width).toBe(50)
    expect(result?.sizes?.card?.url).toBeNull()
  })
})

describe('toUser', () => {
  // Проверка: id строкифицируется, поля профиля сохраняются, avatar undefined,
  // если ссылки нет.
  test('stringifies record id and keeps profile fields', () => {
    const user = toUser({
      id: 'users:abc' as never,
      username: 'mervik',
      nickname: 'mervik',
      bio: 'hi',
      email: undefined,
      avatar: undefined,
    })
    expect(user.id).toBe('users:abc')
    expect(user.username).toBe('mervik')
    expect(user.nickname).toBe('mervik')
    expect(user.bio).toBe('hi')
    expect(user.avatar).toBeUndefined()
  })

  // Проверка: при вложенном объекте media аватар маппится в user.avatar.url.
  test('maps nested avatar when present', () => {
    const user = toUser({
      id: 'users:abc' as never,
      username: 'mervik',
      nickname: 'mervik',
      bio: undefined,
      email: undefined,
      avatar: media as never,
    })
    expect(user.avatar?.url).toBe(media.publicUrl)
  })
})