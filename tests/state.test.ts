import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'
import { useCommentStore } from '../app/stores/comment'
import { useFollowsStore } from '../app/stores/follows'
import { usePostStore } from '../app/stores/post'
import { resetAppState } from '../app/utils/resetState'

let navigateSpy: ReturnType<typeof mock>
let signOutSpy: ReturnType<typeof mock>

beforeEach(() => {
  setActivePinia(createPinia())

  ;(globalThis as Record<string, unknown>).useRuntimeConfig = mock(() => ({ public: {} }))

  navigateSpy = mock(() => {})
  signOutSpy = mock(async () => {})
  ;(globalThis as Record<string, unknown>).navigateTo = navigateSpy
  ;(globalThis as Record<string, unknown>).redirectToLogin = navigateSpy
  ;(globalThis as Record<string, unknown>).authBridge = { value: null }
})

describe('resetAppState', () => {
  // Проверка: сброс всех сторез после логаута — посты, комментарии, подписки
  // очищаются, юзер и модалки возвращаются в исходное состояние.
  test('clears post, comment and follow state and resets user', async () => {
    const authStore = useAuthStore()
    const postStore = usePostStore()
    const commentStore = useCommentStore()
    const followsStore = useFollowsStore()

    postStore.posts = { 'post:1': {} as never }
    postStore.feeds = { global: [] as never }
    postStore.isCreateModalOpen = true
    postStore.isEditModalOpen = true
    postStore.isEditingPost = {} as never
    commentStore.comments = { 'comment:1': {} as never }
    commentStore.feeds = { 'post:1': [] as never }
    followsStore.follows = { 'user:1': {} as never }
    authStore.user = { id: 'user:1' } as never

    await resetAppState()

    expect(postStore.posts).toEqual({})
    expect(postStore.feeds).toEqual({})
    expect(postStore.isCreateModalOpen).toBe(false)
    expect(postStore.isEditModalOpen).toBe(false)
    expect(postStore.isEditingPost).toBeNull()
    expect(commentStore.comments).toEqual({})
    expect(commentStore.feeds).toEqual({})
    expect(followsStore.follows).toEqual({})
    expect(authStore.user).toBeNull()
  })

  // Проверка: повторный сброс на чистом состоянии — без ошибок (идемпотентность).
  test('is idempotent on a fresh app state', async () => {
    await resetAppState()
    await resetAppState()
    const authStore = useAuthStore()
    expect(authStore.user).toBeNull()
  })
})

describe('authStore basics', () => {
  // Проверка: clearUser зануляет хранимого юзера.
  test('clearUser nulls the stored user', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'user:1' } as never
    authStore.clearUser()
    expect(authStore.user).toBeNull()
  })

  // Проверка: getMe не делает ничего, пока auth bridge не готов (юзер остаётся null).
  test('getMe is a no-op while the auth bridge is not ready', async () => {
    const authStore = useAuthStore()
    await authStore.getMe()
    expect(authStore.user).toBeNull()
  })

  // Проверка: logout вызывает signOut через мост, зануляет юзера и редиректит.
  test('logout signs out via the bridge and redirects to login', async () => {
    ;(globalThis as Record<string, unknown>).authBridge = {
      value: { isLoaded: { value: true }, signOut: signOutSpy },
    }
    const authStore = useAuthStore()
    authStore.user = { id: 'user:1' } as never

    await authStore.logout()

    expect(signOutSpy).toHaveBeenCalled()
    expect(authStore.user).toBeNull()
    expect(navigateSpy).toHaveBeenCalled()
  })
})