import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { findScrollContainer } from '../app/utils/dom'

type OverflowElement = HTMLElement & { __overflowY?: string }

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).window = {
    getComputedStyle: mock((element: OverflowElement) => ({
      overflowY: element.__overflowY ?? 'visible',
    })),
  }
})

const el = (overflowY: string, parent: HTMLElement | null = null): HTMLElement => {
  const element = { parentElement: parent, __overflowY: overflowY } as unknown as OverflowElement
  return element
}

describe('findScrollContainer', () => {
  // Проверка: для null (нет элемента) скролл-контейнером считается window.
  test('returns window for null element', () => {
    expect(findScrollContainer(null)).toBe(window)
  })

  // Проверка: если ни один предок не скроллится (overflow visible) — window.
  test('returns window when no ancestor is scrollable', () => {
    const wrapper = el('visible')
    const leaf = el('visible', wrapper)
    expect(findScrollContainer(leaf)).toBe(window)
  })

  // Проверка: находится первый скролл-контейнер с overflow-y: auto.
  test('returns the first scrollable ancestor (auto)', () => {
    const scrollable = el('auto')
    const wrapper = el('visible', scrollable)
    const leaf = el('visible', wrapper)
    expect(findScrollContainer(leaf)).toBe(scrollable)
  })

  // Проверка: overflow-y: scroll тоже считается скролл-контейнером.
  test('matches overflow-y: scroll as well', () => {
    const scrollable = el('scroll')
    const leaf = el('visible', scrollable)
    expect(findScrollContainer(leaf)).toBe(scrollable)
  })

  // Проверка: обход останавливается на БЛИЖАЙШЕМ скролл-контейнере,
  // а не продолжает до верхнего.
  test('stops walking at the nearest scrollable ancestor', () => {
    const topScroll = el('auto')
    const nearScroll = el('scroll', topScroll)
    const leaf = el('visible', nearScroll)
    expect(findScrollContainer(leaf)).toBe(nearScroll)
  })
})