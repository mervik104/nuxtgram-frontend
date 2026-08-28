import { describe, expect, test } from 'bun:test'
import { recordId, recordIdFromString } from '../app/data/surreal/ids'

describe('recordId', () => {
  // Проверка: recordId('users','abc123') строит RecordId с префиксом таблицы.
  test('builds a SurrealDB record id with table prefix', () => {
    const id = recordId('users', 'abc123')
    expect(String(id)).toBe('users:abc123')
  })
})

describe('recordIdFromString', () => {
  // Проверка: разбор строки "table:id" обратно в RecordId без потери данных.
  test('parses a table:id string', () => {
    expect(String(recordIdFromString('users:abc123'))).toBe('users:abc123')
  })

  // Проверка: id с несколькими двоеточиями ("media:foo:bar") разбивается по первому,
  // остаток остаётся в id — SDK корректно экранирует его в ⟨...⟩.
  test('splits on the first colon and lets the SDK keep the rest of the id', () => {
    expect(String(recordIdFromString('media:foo:bar'))).toBe('media:⟨foo:bar⟩')
  })

  // Проверка: строка без ':' считается невалидной и бросает Error.
  test('throws when there is no separator', () => {
    expect(() => recordIdFromString('nocolon')).toThrow(/Invalid record id/)
  })
})