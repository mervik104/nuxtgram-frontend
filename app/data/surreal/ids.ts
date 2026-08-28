import { RecordId } from 'surrealdb'

// «Брендированный» RecordId: тип-тег <T> нужен только для типобезопасности,
// в рантайме это обычный RecordId из surrealdb (table + id).
export type BrandedRecordId<T extends string> = RecordId<T, string>

// Создаёт RecordId из названия таблицы и id-строки.
// Брендированный тип <T> позволяет компилятору следить, к какой таблице
// относится id (users / posts / comments / media).
export function recordId<T extends string>(table: T, id: string): BrandedRecordId<T> {
  return new RecordId(table, id) as unknown as BrandedRecordId<T>
}

// Парсит строковый id формата `table:id` (например "users:x72j3") обратно в RecordId.
// Используется там, где id пришёл строкой: поля коллекций, query-параметры страниц,
// события realtime. Бросает ошибку, если в строке нет разделителя ':'.
export function recordIdFromString<T extends string>(value: string): BrandedRecordId<T> {
  const sep = value.indexOf(':')
  if (sep === -1) throw new Error(`Invalid record id: ${value}`)

  return recordId(value.slice(0, sep) as T, value.slice(sep + 1))
}