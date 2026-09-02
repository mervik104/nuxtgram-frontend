import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { Surreal } from 'surrealdb'
import {
  baseNickname,
  isSupportedImageType,
  ownerPrefixFor,
  publicObjectUrl,
  userObjectKey,
  validObjectKey,
} from './pure'

// Окружение worker (bindings из wrangler.jsonc / секреты в .dev.vars): конфиг
// S3-совместимого хранилища (Cloudflare R2), лимиты загрузок, параметры Clerk
// и сервисные доступы к SurrealDB.
interface Env {
  S3_ENDPOINT: string
  S3_BUCKET_NAME: string
  S3_PUBLIC_BASE_URL: string
  S3_ACCESS_KEY_ID: string
  S3_SECRET_ACCESS_KEY: string
  S3_SIGNED_URL_TTL_SECONDS: string
  S3_REGION?: string
  MAX_UPLOAD_BYTES: string
  CLERK_ISSUER: string
  CLERK_JWKS_URL: string
  CLERK_AUDIENCE: string
  SURREALDB_URL: string
  SURREALDB_NAMESPACE: string
  SURREALDB_DATABASE: string
  SURREALDB_SERVICE_USERNAME: string
  SURREALDB_SERVICE_PASSWORD: string
  FRONTEND_ORIGIN: string
}

// Итог аутентификации: clerkId (sub из JWT) + сырой payload токена.
interface AuthenticatedUser {
  clerkId: string
  token: JWTPayload
}

// Тело POST /media/upload-url (запрос подписанного URL).
interface UploadRequest {
  filename: string
  contentType: string
  size: number
}

// Тело запросов, оперирующих существующим объектом (delete-url).
interface ObjectRequest {
  objectKey: string
}

// Тело POST /auth/provision.
interface ProvisionRequest {
  username: string
}

// Тело complete-avatar / complete (фиксация метаданных загруженного файла).
interface AvatarCompleteRequest {
  objectKey: string
  filename: string
  alt?: string
}

// Минимальный срез записи users, несущий поле avatar.objectKey.
interface AvatarRecord {
  objectKey?: string
}

// Минимальный срез записи users (нужен только id).
interface UserRecord {
  id: unknown
}

// Минимальный срез записи media для запросов worker.
interface MediaRecord {
  id: unknown
  objectKey?: string
  publicUrl?: string
}

// Кэш JWKS Set Clerk: создаётся один раз и переиспользуется,
// а при смене CLERK_JWKS_URL пересоздаётся (полезно на продакшене).
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
let jwksUrl = ''

// ВРЕМЕННО (2026-08-28): CORS открыт на все домены (ACAO: *), чтобы работали
// локальная разработка и тесты с LAN-устройств (localhost:3000, 192.168.x.x).
// ПЕРЕД ПРОДАКШЕН-ДЕПЛОЕМ сузить: вернуть отражение запрошенного Origin и
// выставить FRONTEND_ORIGIN на боевой домен (см. docs/TODO-security.md и
// wrangler.jsonc). Access-Control-Max-Age снижен до 600, чтобы закешированные
// префлайты (старые ACAO localhost:3000 на 86400) быстрее выветривались.
// CORS-заголовки для ВСЕХ ответов и preflight.
function corsHeaders(env: Env, requestOrigin?: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  })

  return headers
}

// JSON-ответ с CORS-заголовками и application/json.
function json(env: Env, body: unknown, status = 200): Response {
  const headers = corsHeaders(env)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers })
}

// Достаёт Bearer-токен из заголовка Authorization (или null).
function getBearerToken(request: Request): string | null {
  const value = request.headers.get('Authorization')
  if (!value?.startsWith('Bearer ')) return null
  return value.slice('Bearer '.length).trim() || null
}

// Верифицирует Clerk JWT (issuer + audience) и возвращает { clerkId, payload }.
// Бросает Response(401) при отсутствии/невалидности токена.
async function authenticate(request: Request, env: Env): Promise<AuthenticatedUser> {
  const token = getBearerToken(request)
  if (!token) throw new Response('Unauthorized', { status: 401 })

  if (!jwks || jwksUrl !== env.CLERK_JWKS_URL) {
    jwks = createRemoteJWKSet(new URL(env.CLERK_JWKS_URL))
    jwksUrl = env.CLERK_JWKS_URL
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: env.CLERK_ISSUER,
    audience: env.CLERK_AUDIENCE,
  })

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Response('Invalid token subject', { status: 401 })
  }

  return { clerkId: payload.sub, token: payload }
}

// S3-совместимый клиент Cloudflare R2 (или любого S3-провайдера) из env-конфига.
// Для R2 регион должен быть 'auto', endpoint — R2 S3 API-домен, креды — R2 API-токен.
function createStorageClient(env: Env): S3Client {
  return new S3Client({
    region: env.S3_REGION || 'auto',
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  })
}

// Хард-валидация TTL подписанных URL (1..604800 секунд).
function signedUrlTtl(env: Env): number {
  const ttl = Number(env.S3_SIGNED_URL_TTL_SECONDS)
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > 604800) {
    throw new Error('S3_SIGNED_URL_TTL_SECONDS must be between 1 and 604800')
  }
  return ttl
}

// Максимальный размер загрузки из env (валидация конфига).
function maxUploadBytes(env: Env): number {
  const max = Number(env.MAX_UPLOAD_BYTES)
  if (!Number.isInteger(max) || max < 1) {
    throw new Error('MAX_UPLOAD_BYTES is not configured')
  }
  return max
}

// Нормализует alt-текст: строка, тримится, лимит 200 символов, fallback.
function cleanAlt(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return (trimmed || fallback).slice(0, 200)
}

// Открывает сессию SurrealDB от имени сервисного аккаунта (обязателен
// namespace + database для аутентификации на сервере).
async function connectServiceDb(env: Env): Promise<Surreal> {
  if (!env.SURREALDB_SERVICE_USERNAME || !env.SURREALDB_SERVICE_PASSWORD) {
    throw new Error('SurrealDB service credentials are not configured')
  }

  const database = new Surreal()
  await database.connect(env.SURREALDB_URL, {
    namespace: env.SURREALDB_NAMESPACE,
    database: env.SURREALDB_DATABASE,
    authentication: {
      namespace: env.SURREALDB_NAMESPACE,
      database: env.SURREALDB_DATABASE,
      username: env.SURREALDB_SERVICE_USERNAME,
      password: env.SURREALDB_SERVICE_PASSWORD,
    },
  })
  return database
}

// Ищет запись users по clerkId (проекция: только id).
async function findOwnerByClerkId(database: Surreal, clerkId: string): Promise<UserRecord | undefined> {
  const result = await database
    .query<[UserRecord[]]>('SELECT * FROM users WHERE clerkId = $clerkId LIMIT 1', { clerkId })
    .collect()
  return result[0]?.[0]
}

// Ищет запись media по objectKey (для идемпотентности complete-запросов).
async function findMediaByObjectKey(database: Surreal, objectKey: string): Promise<MediaRecord | undefined> {
  const result = await database
    .query<[MediaRecord[]]>('SELECT * FROM media WHERE objectKey = $objectKey LIMIT 1', { objectKey })
    .collect()
  return result[0]?.[0]
}

// Создаёт метаданные media для загруженного файла (или возвращает существующую
// запись с тем же objectKey — защита от дублей при повторной фиксации).
async function findOrCreateMedia(
  database: Surreal,
  env: Env,
  values: {
    owner: unknown
    objectKey: string
    filename: string
    alt: string
    mimeType: string
    size: number
  },
): Promise<MediaRecord> {
  const existing = await findMediaByObjectKey(database, values.objectKey)
  if (existing) return existing

  const createdResult = await database
    .query<[MediaRecord[]]>(
      `CREATE media CONTENT {
        owner: $owner,
        objectKey: $objectKey,
        publicUrl: $publicUrl,
        filename: $filename,
        alt: $alt,
        mimeType: $mimeType,
        size: $size
      } RETURN AFTER`,
      {
        owner: values.owner,
        objectKey: values.objectKey,
        publicUrl: publicObjectUrlFor(env, values.objectKey),
        filename: values.filename,
        alt: values.alt,
        mimeType: values.mimeType,
        size: values.size,
      },
    )
    .collect()
  const created = createdResult[0]?.[0]
  if (!created) throw new Error('Media metadata creation failed')
  return created
}

// 4-значный псевдослучайный суффикс для генерации уникальных никнеймов.
function randomSuffix(): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return 1000 + (values[0] % 9000)
}

// Публичный URL объекта с проверкой, что S3_PUBLIC_BASE_URL реально настроен.
function publicObjectUrlFor(env: Env, objectKey: string): string {
  if (!env.S3_PUBLIC_BASE_URL || env.S3_PUBLIC_BASE_URL === '<SET_IN_WRANGLER_ENV>') {
    throw new Error('S3_PUBLIC_BASE_URL is not configured')
  }
  return publicObjectUrl(env.S3_PUBLIC_BASE_URL, objectKey)
}

// POST /media/upload-url: возвращает подписанный PUT-URL для прямой загрузки
// файла в R2 с браузера (обход потока через worker). Валидирует тип и размер.
async function uploadUrl(request: Request, env: Env): Promise<Response> {
  const user = await authenticate(request, env)
  const body = await request.json<UploadRequest>()

  if (!body.filename || !body.contentType || !Number.isInteger(body.size) || body.size <= 0) {
    return json(env, { message: 'filename, contentType and positive size are required' }, 400)
  }

  if (!isSupportedImageType(body.contentType)) {
    return json(env, { message: 'Only image uploads are allowed' }, 400)
  }

  if (body.size > maxUploadBytes(env)) {
    return json(env, { message: 'File is too large' }, 413)
  }

  const objectKey = userObjectKey(user.clerkId, body.filename)
  const publicUrl = publicObjectUrlFor(env, objectKey)
  const url = await getSignedUrl(
    createStorageClient(env),
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: objectKey,
      ContentType: body.contentType,
      ContentLength: body.size,
    }),
    { expiresIn: signedUrlTtl(env) },
  )

  return json(env, {
    method: 'PUT',
    objectKey,
    publicUrl,
    url,
    headers: {
      'Content-Type': body.contentType,
    },
    expiresIn: signedUrlTtl(env),
  })
}

// POST /media/upload: буферизует тело запроса, загружает файл в R2 (PUT)
// и создаёт запись media в SurrealDB. Используется, когда прямой PUT невозможен.
async function uploadBytes(request: Request, env: Env): Promise<Response> {
  const user = await authenticate(request, env)
  const url = new URL(request.url)
  const filename = url.searchParams.get('filename') || ''
  const contentType = url.searchParams.get('contentType') || ''

  if (!filename || !contentType) {
    return json(env, { message: 'filename and contentType query params are required' }, 400)
  }

  if (!isSupportedImageType(contentType)) {
    return json(env, { message: 'Only image uploads are allowed' }, 400)
  }

  const body = await new Response(request.body).arrayBuffer()
  if (body.byteLength <= 0) {
    return json(env, { message: 'File body is empty' }, 400)
  }

  if (body.byteLength > maxUploadBytes(env)) {
    return json(env, { message: 'File is too large' }, 413)
  }

  const objectKey = userObjectKey(user.clerkId, filename)
  const publicUrl = publicObjectUrlFor(env, objectKey)

  await createStorageClient(env).send(new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
    ContentLength: body.byteLength,
  }))

  const database = await connectServiceDb(env)
  try {
    const owner = await findOwnerByClerkId(database, user.clerkId)
    if (!owner) {
      return json(env, { message: 'Application user profile is not provisioned' }, 404)
    }

    const media = await findOrCreateMedia(database, env, {
      owner: owner.id,
      objectKey,
      filename,
      alt: cleanAlt(filename, filename),
      mimeType: contentType,
      size: body.byteLength,
    })

    return json(env, {
      objectKey,
      publicUrl,
      size: body.byteLength,
      contentType,
      media: { id: String(media.id) },
    }, 201)
  } finally {
    await database.close()
  }
}

// POST /media/complete-avatar (attachAvatar=true) и /media/complete (false):
// фиксирует метаданные загруженного файла и, для аватара, назначает его юзеру.
// Проверяет владение (objectKey под префиксом текущего юзера) и существование media.
async function completeMediaMetadata(request: Request, env: Env, attachAvatar: boolean): Promise<Response> {
  const identity = await authenticate(request, env)
  const body = await request.json<AvatarCompleteRequest>()
  const ownerPrefix = ownerPrefixFor(identity.clerkId)

  if (
    typeof body.filename !== 'string' ||
    body.filename.length === 0 ||
    body.filename.length > 255 ||
    !validObjectKey(body.objectKey) ||
    !body.objectKey.startsWith(ownerPrefix)
  ) {
    return json(env, { message: 'Invalid avatar upload' }, 400)
  }

  const database = await connectServiceDb(env)
  try {
    const media = await findMediaByObjectKey(database, body.objectKey)
    if (!media) {
      return json(env, { message: 'Media record not found; upload first' }, 404)
    }

    if (attachAvatar) {
      await database.query('UPDATE users SET avatar = $mediaId WHERE clerkId = $clerkId', {
        mediaId: media.id,
        clerkId: identity.clerkId,
      }).collect()
    }

    const alt = cleanAlt(body.alt, body.filename)
    return json(env, {
      media: {
        id: String(media.id),
        alt,
        url: media.publicUrl || publicObjectUrlFor(env, body.objectKey),
      },
    }, 201)
  } finally {
    await database.close()
  }
}

// POST /media/complete-avatar: фиксация загруженного аватара + привязка к users.avatar.
async function completeAvatar(request: Request, env: Env): Promise<Response> {
  return await completeMediaMetadata(request, env, true)
}

// POST /media/complete: фиксация метаданных обычного медиа-файла (без привязки).
async function completeMedia(request: Request, env: Env): Promise<Response> {
  return await completeMediaMetadata(request, env, false)
}

// POST /media/delete-avatar: удаляет аватар текущего юзера — файл из R2,
// запись media и ссылку users.avatar. Проверяет владение объектом.
async function deleteAvatar(request: Request, env: Env): Promise<Response> {
  const identity = await authenticate(request, env)

  if (!env.SURREALDB_SERVICE_USERNAME || !env.SURREALDB_SERVICE_PASSWORD) {
    return json(env, { message: 'User provisioning is not configured' }, 503)
  }

  const database = await connectServiceDb(env)
  try {
    const userResult = await database
      .query<[AvatarRecord[]]>(
        'SELECT avatar.objectKey AS objectKey FROM users WHERE clerkId = $clerkId LIMIT 1',
        { clerkId: identity.clerkId },
      )
      .collect()
    const objectKey = userResult[0]?.[0]?.objectKey

    if (!objectKey || !validObjectKey(objectKey)) {
      return json(env, { message: 'Avatar not found' }, 404)
    }

    if (!objectKey.startsWith(ownerPrefixFor(identity.clerkId))) {
      return json(env, { message: 'Object ownership check failed' }, 403)
    }

    await createStorageClient(env).send(new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: objectKey,
    }))

    await database
      .query('DELETE media WHERE objectKey = $objectKey', { objectKey })
      .collect()
    await database
      .query('UPDATE users SET avatar = NONE WHERE clerkId = $clerkId', {
        clerkId: identity.clerkId,
      })
      .collect()

    return json(env, { message: 'Avatar removed' })
  } finally {
    await database.close()
  }
}

// POST /media/delete-url: подписанный DELETE-URL для прямого удаления файла.
// Проверяет владение объектом (префикс текущего юзера).
async function deleteUrl(request: Request, env: Env): Promise<Response> {
  const user = await authenticate(request, env)
  const body = await request.json<ObjectRequest>()
  const ownerPrefix = ownerPrefixFor(user.clerkId)

  if (!validObjectKey(body.objectKey) || !body.objectKey.startsWith(ownerPrefix)) {
    return json(env, { message: 'Object ownership check failed' }, 403)
  }

  const url = await getSignedUrl(
    createStorageClient(env),
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: body.objectKey,
    }),
    { expiresIn: signedUrlTtl(env) },
  )

  return json(env, {
    method: 'DELETE',
    objectKey: body.objectKey,
    url,
    expiresIn: signedUrlTtl(env),
  })
}

// POST /auth/provision: создаёт профиль users для авторизованного Clerk-юзера
// (идемпотентно — повторный вызов вернёт существующего). Никнейм генерируется
// из username с числовым суффиксом и проверкой уникальности (до 20 попыток).
async function provisionUser(request: Request, env: Env): Promise<Response> {
  const identity = await authenticate(request, env)
  const body = await request.json<ProvisionRequest>()

  if (typeof body.username !== 'string' || body.username.length < 3 || body.username.length > 48) {
    return json(env, { message: 'Username must contain between 3 and 48 characters' }, 400)
  }

  if (!env.SURREALDB_SERVICE_USERNAME || !env.SURREALDB_SERVICE_PASSWORD) {
    return json(env, { message: 'User provisioning is not configured' }, 503)
  }

  const database = await connectServiceDb(env)

  try {
    const existing = await findOwnerByClerkId(database, identity.clerkId)

    if (existing) {
      return json(env, { userId: String(existing.id), created: false })
    }

    let nickname = ''
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `${baseNickname(body.username)}${randomSuffix()}`
      const duplicateResult = await database
        .query<[UserRecord[]]>('SELECT * FROM users WHERE nickname = $nickname LIMIT 1', {
          nickname: candidate,
        })
        .collect()
      const duplicate = duplicateResult[0]?.[0]

      if (!duplicate) {
        nickname = candidate
        break
      }
    }

    if (!nickname) {
      return json(env, { message: 'Could not generate a unique nickname' }, 409)
    }

    const createdResult = await database
      .query<[UserRecord[]]>(
        `CREATE users CONTENT {
          clerkId: $clerkId,
          username: $username,
          nickname: $nickname,
          legacyId: NONE,
          bio: NONE,
          email: NONE,
          avatar: NONE
        } RETURN AFTER`,
        {
          clerkId: identity.clerkId,
          username: body.username,
          nickname,
        },
      )
      .collect()
    const created = createdResult[0]?.[0]

    if (!created) {
      return json(env, { message: 'User provisioning failed' }, 500)
    }

    return json(env, { userId: String(created.id), created: true }, 201)
  } catch (error) {
    console.error('provision user error:', error)
    return json(env, { message: 'User provisioning failed', detail: String(error instanceof Error ? error.message : error) }, 500)
  } finally {
    await database.close()
  }
}

// Точка входа worker: маршрутизация POST-запросов по pathname,
// preflight-ответ на OPTIONS, единая обработка ошибок и нормализация
// CORS-заголовков на ВСЕХ ответах (включая 401/500).
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const requestOrigin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, requestOrigin) })
    }

    let response: Response

    try {
      if (request.method === 'POST' && url.pathname === '/media/upload-url') {
        response = await uploadUrl(request, env)
      } else if (request.method === 'POST' && url.pathname === '/media/upload') {
        response = await uploadBytes(request, env)
      } else if (request.method === 'POST' && url.pathname === '/media/complete-avatar') {
        response = await completeAvatar(request, env)
      } else if (request.method === 'POST' && url.pathname === '/media/complete') {
        response = await completeMedia(request, env)
      } else if (request.method === 'POST' && url.pathname === '/media/delete-avatar') {
        response = await deleteAvatar(request, env)
      } else if (request.method === 'POST' && url.pathname === '/media/delete-url') {
        response = await deleteUrl(request, env)
      } else if (request.method === 'POST' && url.pathname === '/auth/provision') {
        response = await provisionUser(request, env)
      } else {
        response = json(env, { message: 'Not found' }, 404)
      }
    } catch (error) {
      if (error instanceof Response) {
        response = error
      } else {
        console.error('Worker request failed', error)
        response = json(env, {
          message: error instanceof Error ? error.message : String(error),
        }, 500)
      }
    }

    if (requestOrigin && !response.headers.has('Access-Control-Allow-Origin')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    if (requestOrigin) {
      response.headers.set('Vary', 'Origin')
    }

    return response
  },
} satisfies ExportedHandler<Env>
