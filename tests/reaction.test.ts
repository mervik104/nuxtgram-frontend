import { describe, expect, test } from 'bun:test'
import { EMPTY_REACTIONS, flipReaction, snapshotReaction, type ReactionState } from '../app/utils/reaction'

const base = (): ReactionState => ({
  myReaction: null,
  reactionsCount: { ...EMPTY_REACTIONS },
})

describe('flipReaction', () => {
  // Проверка: при отсутствии реакции — добавление (myReaction + счётчик +1).
  test('adds a reaction and sets myReaction when none exists', () => {
    const next = flipReaction(base(), 'like')
    expect(next.myReaction).toBe('like')
    expect(next.reactionsCount.like).toBe(1)
  })

  // Проверка: повторный тап по той же реакции — снятие (myReaction=null, счётчик 0).
  test('removes the reaction when tapping the current one', () => {
    const initial = flipReaction(base(), 'like')
    const next = flipReaction(initial, 'like')
    expect(next.myReaction).toBeNull()
    expect(next.reactionsCount.like).toBe(0)
  })

  // Проверка: функция чистая — исходное состояние не мутируется.
  test('does not mutate the input state', () => {
    const state = base()
    flipReaction(state, 'fire')
    expect(state.myReaction).toBeNull()
    expect(state.reactionsCount.fire).toBe(0)
  })

  // Проверка: счётчики других реакций нетронуты.
  test('keeps unrelated counters untouched', () => {
    const state: ReactionState = {
      myReaction: 'like',
      reactionsCount: { like: 1, love: 3, fire: 0, haha: 2 },
    }
    const next = flipReaction(state, 'like')
    expect(next.reactionsCount.love).toBe(3)
    expect(next.reactionsCount.haha).toBe(2)
    expect(next.reactionsCount.fire).toBe(0)
  })

  // Проверка: повторное снятие не уводит счётчик в минус.
  test('counts never go below zero on repeated toggle-off', () => {
    const state: ReactionState = {
      myReaction: 'love',
      reactionsCount: { like: 0, love: 0, fire: 0, haha: 0 },
    }
    const next = flipReaction(state, 'love')
    expect(next.reactionsCount.love).toBe(0)
  })
})

describe('snapshotReaction / rollback', () => {
  // Проверка: snapshot + ручное восстановление воспроизводят точное прежнее
  // состояние (нужно для отката при ошибке серверного запроса).
  test('snapshot and restore reproduces the exact previous state', () => {
    const state: ReactionState = {
      myReaction: null,
      reactionsCount: { like: 2, love: 4, fire: 1, haha: 0 },
    }
    const previous = snapshotReaction(state)
    const next = flipReaction(state, 'like')
    expect(next.reactionsCount.like).toBe(3)

    state.myReaction = previous.myReaction
    state.reactionsCount = previous.reactionsCount
    expect(state).toEqual(previous)
  })
})