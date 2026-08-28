import { describe, expect, test } from 'bun:test'
import { recordId } from '../app/data/surreal/ids'
import {
  commentReactions,
  comments,
  follows,
  media,
  postReactions,
  posts,
  users,
} from '../app/data/surreal/schema'

describe('schema tables', () => {
  // Проверка: объявлены ожидаемые имена таблиц.
  test('declares the expected table names', () => {
    expect(users.tb).toBe('users')
    expect(media.tb).toBe('media')
    expect(posts.tb).toBe('posts')
    expect(comments.tb).toBe('comments')
  })

  // Проверка: у каждой таблицы есть служебное поле id.
  test('tables expose an id field (record type)', () => {
    for (const table of [users, media, posts, comments]) {
      expect(table.fields).toHaveProperty('id')
    }
  })

  // Проверка: таблица users содержит все поля профиля (clerkId, nickname, ...).
  test('users table carries the core profile fields', () => {
    const fields = users.fields as Record<string, unknown>
    for (const name of ['clerkId', 'legacyId', 'username', 'nickname', 'bio', 'email', 'avatar']) {
      expect(fields).toHaveProperty(name)
    }
  })

  // Проверка: таблица media содержит поля хранилища и размеров.
  test('media table carries storage + size fields', () => {
    const fields = media.fields as Record<string, unknown>
    for (const name of ['objectKey', 'publicUrl', 'filename', 'mimeType', 'size', 'width', 'height']) {
      expect(fields).toHaveProperty(name)
    }
  })

  // Проверка: validate() принимает структурно валидную строку юзера.
  test('validate() accepts a structurally valid user row', () => {
    const row = {
      id: recordId('users', 'u1'),
      clerkId: 'user_123',
      username: 'alice',
      nickname: 'alice_dev',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(users.validate(row)).toBe(true)
  })

  // Проверка: validate() отклоняет строку без обязательных полей.
  test('validate() rejects a row missing required fields', () => {
    expect(users.validate({ username: 'alice' } as never)).toBe(false)
  })
})

describe('schema edges', () => {
  // Проверка: ребро follows соединяет users → users.
  test('follows edge: users -> users', () => {
    expect(follows.from).toBe('users')
    expect(follows.tb).toBe('follows')
    expect(follows.to).toBe('users')
  })

  // Проверка: ребро post_reactions users → posts с полем type.
  test('post_reactions edge: users -> posts with fields', () => {
    expect(postReactions.from).toBe('users')
    expect(postReactions.tb).toBe('post_reactions')
    expect(postReactions.to).toBe('posts')
    expect(postReactions.fields as Record<string, unknown>).toHaveProperty('type')
  })

  // Проверка: ребро comment_reactions users → comments.
  test('comment_reactions edge: users -> comments with fields', () => {
    expect(commentReactions.from).toBe('users')
    expect(commentReactions.tb).toBe('comment_reactions')
    expect(commentReactions.to).toBe('comments')
  })
})