// Чистые вспомогательные функции worker (без I/O): можно юнит-тестить отдельно.
// Все функции детерминированы по входу => нет зависимости от окружения.

// Префикс ключей объектов в R2/B2: всё хранится под «media/…».
export const OBJECT_PREFIX = 'media/'

// Разрешённые типы изображений при загрузке (другие сервер отклонит).
export const SAFE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
])

// Является ли content-type поддерживаемым типом изображения (trim + lowercase).
export function isSupportedImageType(contentType: string): boolean {
  return SAFE_IMAGE_TYPES.has(contentType.trim().toLowerCase())
}

// Очищает имя файла от опасных символов: убирает пути (\ /), не-ASCII заменяет
// на '-', запрещает '..', обрезает до 120 символов. Fallback — 'upload'.
export function cleanFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? ''
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.\./g, '-')
  return safe.slice(0, 120) || 'upload'
}

// Валидатор ключа объекта: обязательно префикс 'media/', без directory-traversal
// ('..') и без обратных слешей (защита от обхода путей в URL).
export function validObjectKey(objectKey: string): boolean {
  return (
    typeof objectKey === 'string' &&
    objectKey.startsWith(OBJECT_PREFIX) &&
    !objectKey.includes('..') &&
    !objectKey.includes('\\')
  )
}

// Префикс ключа, выделяющий владельцу: 'media/<userId>/'.
// Используется для проверки владения объектом (только свои файлы можно менять/удалять).
export function ownerPrefixFor(userId: string): string {
  return `${OBJECT_PREFIX}${encodeURIComponent(userId)}/`
}

// Генерирует ключ объекта для загрузки юзером: префикс владельца + UUID + чистое имя.
export function userObjectKey(userId: string, filename: string): string {
  return `${ownerPrefixFor(userId)}${crypto.randomUUID()}-${cleanFilename(filename)}`
}

// Формирует публичный URL объекта: baseUrl' + key, с encodeURIComponent каждого сегмента.
export function publicObjectUrl(publicBaseUrl: string, objectKey: string): string {
  const baseUrl = publicBaseUrl.replace(/\/+$/, '')
  const encodedKey = objectKey.split('/').map((part) => encodeURIComponent(part)).join('/')
  return `${baseUrl}/${encodedKey}`
}

// Базовый никнейм из имени пользователя: без пробелов, lowercase, до 10 символов.
// На его основе provision генерирует уникальный nickname (с числовым суффиксом).
export function baseNickname(username: string): string {
  return username.replace(/\s/g, '').toLowerCase().slice(0, 10)
}