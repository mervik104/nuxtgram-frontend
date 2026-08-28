import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { redirectToFeed, redirectToLogin, redirectToProfile, redirectToRegister } from '../app/utils/redirects'

type NavigateFn = (path: string) => void

let navigateTo: NavigateFn

beforeEach(() => {
  navigateTo = mock(() => {})
  ;(globalThis as Record<string, unknown>).navigateTo = navigateTo
})

describe('redirect helpers', () => {
  // Проверка: redirectToLogin ведёт на /login.
  test('redirectToLogin navigates to /login', () => {
    redirectToLogin()
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  // Проверка: redirectToRegister ведёт на /register.
  test('redirectToRegister navigates to /register', () => {
    redirectToRegister()
    expect(navigateTo).toHaveBeenCalledWith('/register')
  })

  // Проверка: без postId redirectToFeed ведёт на /feed.
  test('redirectToFeed navigates to /feed by default', () => {
    redirectToFeed()
    expect(navigateTo).toHaveBeenCalledWith('/feed')
  })

  // Проверка: с postId редирект уходит на конкретный пост /feed/post:abc.
  test('redirectToFeed routes to a specific post', () => {
    redirectToFeed('post:abc')
    expect(navigateTo).toHaveBeenCalledWith('/feed/post:abc')
  })

  // Проверка: пустой/ложный postId игнорируется (идём на /feed).
  test('redirectToFeed ignores a falsy postId', () => {
    redirectToFeed('')
    expect(navigateTo).toHaveBeenCalledWith('/feed')
  })

  // Проверка: redirectToProfile ведёт в профиль по никнейму.
  test('redirectToProfile routes to the nickname', () => {
    redirectToProfile('alice')
    expect(navigateTo).toHaveBeenCalledWith('/profile/alice')
  })
})