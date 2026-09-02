import { describe, expect, test } from 'bun:test'
import { toPost, toRecordIds } from '../app/data/surreal/posts'

describe('post mappers', () => {
  test('maps a post and keeps media order', () => {
    const post = toPost({
      id: 'posts:p1',
      content: 'hello',
      author: { id: 'users:u1', username: 'Alice', nickname: 'alice' } as never,
      createdAt: '2026-09-02T10:00:00Z',
      updatedAt: '2026-09-02T10:00:00Z',
    } as never, [
      { id: 'media:m1', publicUrl: 'https://cdn/1.jpg', filename: '1.jpg', alt: '', mimeType: 'image/jpeg', size: 1, width: 10, height: 10, createdAt: '', updatedAt: '' } as never,
      { id: 'media:m2', publicUrl: 'https://cdn/2.jpg', filename: '2.jpg', alt: '', mimeType: 'image/jpeg', size: 2, width: 20, height: 10, createdAt: '', updatedAt: '' } as never,
    ])

    expect(post.id).toBe('posts:p1')
    expect(post.author.nickname).toBe('alice')
    expect(post.image?.map((image) => image.url)).toEqual(['https://cdn/1.jpg', 'https://cdn/2.jpg'])
    expect(post.myReaction).toBeNull()
  })

  test('normalizes record ids and ignores empty image values', () => {
    expect(toRecordIds(['m1', 'media:m2'] as never)).toEqual(['media:m1', 'media:m2'])
    expect(toRecordIds(undefined)).toEqual([])
  })
})
