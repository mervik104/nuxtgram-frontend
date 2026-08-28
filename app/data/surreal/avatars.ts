import type { NuxtgramDatabase } from './client'
import { recordIdFromString } from './ids'
import type { MediaRow } from './schema'

// Avatar-гидрация (НЕ путать с .fetch('avatar') у surqlize).
//
// Зачем это отдельное место нужно:
// surqlize's `.fetch('avatar')` подставляет на место `users.avatar` ПОЛНУЮ схему
// таблицы `media` (объект со всеми полями). Но тип поля в схеме заявлен как
// `t.option(t.record('media'))`, а RecordType.validate принимает только RecordId.
// Итог: `SELECT ... FETCH avatar` роняет весь запрос с
// `Expected Option<RecordId<media>> but found [object Object]` — любой запрос,
// где юзер.avatar не пустой. Отсюда «слетела авторизация в UI», пустые аватары,
// тормозящие профили и т.п.
//
// Поэтому media мы НЕ фетчим через ORM-схему записей, а дёргаем отдельным
// запросом `select('media') WHERE id INSIDE [...]` (там `media` парсится как
// обычная таблица и RecordId-поля внутри валидны), после чего вручную кладём
// полный MediaRow в `row.avatar` — мапперы toAvatar/toUser уже умеют объект.

type AvatarHolder = object

// Возвращает значение поля `avatar` у произвольной строки-объекта
// (UserRow или RecordId) — null-safe, на не-объектах вернёт undefined.
function avatarOf(row: unknown): unknown {
  return row && typeof row === 'object' ? (row as { avatar?: unknown }).avatar : undefined
}

// Узкий type-guard: похоже ли значение на RecordId (есть поле `id`).
function isRecordLike(value: unknown): value is { table?: unknown; id?: unknown } {
  return typeof value === 'object' && value !== null && 'id' in (value as { id?: unknown })
}

// Проверка: значение — уже гидратированный объект media (есть строка publicUrl).
// Такие повторно фетчить не нужно.
function isHydratedMedia(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { publicUrl?: unknown }).publicUrl === 'string'
  )
}

// Нормализует ссылку на media в строковый ключ `media:<id>`.
// Вернёт null, если аватара нет, он уже гидратирован или ссылка не валидна.
function avatarRecordIdKey(avatar: unknown): string | null {
  if (isHydratedMedia(avatar)) return null
  if (typeof avatar === 'string') return avatar.includes(':') ? avatar : null
  if (isRecordLike(avatar)) {
    const table = 'table' in avatar && avatar.table ? String(avatar.table) : 'media'
    return `${table}:${String(avatar.id)}`
  }
  return null
}

// Одним запросом тянем все нужные записи media и возвращаем Map «media:<id>» → MediaRow.
export async function fetchAvatarMedia(
  db: NuxtgramDatabase,
  rows: Iterable<unknown>,
): Promise<Map<string, MediaRow>> {
  const keys = new Set<string>()
  for (const row of rows) {
    const key = avatarRecordIdKey(avatarOf(row))
    if (key) keys.add(key)
  }
  if (keys.size === 0) return new Map()

  const mediaRows = await db
    .select('media')
    .where((m) => m.id.inside([...keys].map((key) => recordIdFromString<'media'>(key))))

  return new Map((mediaRows as unknown as MediaRow[]).map((row) => [String(row.id), row]))
}

// Мутируем строки-юзеров: где аватар ссылался на найденный media — подменяем
// RecordId на полный объект MediaRow (null-safe).
export function applyAvatars(rows: Iterable<unknown>, map: Map<string, MediaRow>): void {
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const key = avatarRecordIdKey(avatarOf(row))
    const media = key ? map.get(key) : undefined
    if (media) (row as { avatar?: unknown }).avatar = media
  }
}

// Фетч + применение одним шагом для списка юзеров.
export async function hydrateUserAvatar(db: NuxtgramDatabase, rows: Iterable<unknown>): Promise<void> {
  const map = await fetchAvatarMedia(db, rows)
  applyAvatars(rows, map)
}