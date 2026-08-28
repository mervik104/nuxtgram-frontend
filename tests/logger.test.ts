import { beforeEach, describe, expect, test } from 'bun:test'
import { internals } from '../app/utils/logger'

const { buildEntry, normalizeArgs, _reset } = internals

beforeEach(() => _reset())

describe('normalizeArgs', () => {
  // Проверка: примитивные аргументы (строки/числа/булевы) передаются как есть.
  test('passes strings and numbers through', () => {
    expect(normalizeArgs(['a', 1, true])).toEqual(['a', 1, true])
  })

  // Проверка: Error превращается в безопасный конверт {kind, message}
  // (чтобы сериализация в JSON не теряла сообщение).
  test('turns Errors into a safe envelope', () => {
    const result = normalizeArgs([new Error('boom')])[0] as { kind: string; message: string }
    expect(result.kind).toBe('Error')
    expect(result.message).toBe('boom')
  })

  // Проверка: очень большие объекты урезаются (флаг __truncated),
  // чтобы лог-файл не раздувался.
  test('truncates huge objects to keep files small', () => {
    const result = normalizeArgs([{ big: 'x'.repeat(5000) }])[0] as { __truncated?: boolean }
    expect(result.__truncated).toBe(true)
  })

  // Проверка: null/undefined проходят как есть, Date сериализуется в ISO-строку.
  test('handles null/undefined/Date', () => {
    expect(normalizeArgs([null, undefined])).toEqual([null, undefined])
    const date = normalizeArgs([new Date(0)])[0]
    expect(date).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('buildEntry', () => {
  // Проверка: единственный аргумент-объект сворачивается в entry.data,
  // заполняются area/msg/seq/ts/session.
  test('collapses a single data arg', () => {
    const entry = buildEntry('db', 'debug', 'connected', [{ ok: true }])
    expect(entry.area).toBe('db')
    expect(entry.msg).toBe('connected')
    expect(entry.data).toEqual({ ok: true })
    expect(entry.seq).toBe(1)
    expect(entry.ts).toBeTruthy()
    expect(entry.session).toBeTruthy()
  })

  // Проверка: несколько аргументов сохраняются как массив в entry.data.
  test('keeps multiple args as an array', () => {
    const entry = buildEntry('feed', 'trace', 'page', ['a', 'b'])
    expect(entry.data).toEqual(['a', 'b'])
  })

  // Проверка: сообщение обрезается до лимита (2000 символов).
  test('caps message length', () => {
    const entry = buildEntry('x', 'debug', 'm'.repeat(3000), [])
    expect(entry.msg.length).toBe(2000)
  })
})