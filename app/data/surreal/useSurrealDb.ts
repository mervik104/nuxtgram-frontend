import { Surreal, NotAllowedError } from 'surrealdb'
import { log, logError } from '~/utils/logger'
import { authBridge } from '~/utils/authBridge'
import { hydrateUserAvatar } from './avatars'
import { createNuxtgramDatabase, type NuxtgramDatabase } from './client'
import type { UserRow } from './schema'
import type { AuthBridge } from '~/utils/authBridge'

// Модуль-синглтон доступа к SurrealDB на клиенте.
//
// Сессия (Surreal instance) создаётся один раз и переиспользуется:
//  - анонимная (guest) — когда Clerk не авторизован (публичные SELECT'ы),
//  - рекорд-юзер с Clerk JWT (шаблон JWT несёт ac/ns/db + audience), когда авторизован.
// Одна пара «сессия+ORM». При смене состояния используется переподключение.

let session: { client: Surreal; authed: boolean } | null = null
let connection: Promise<NuxtgramDatabase> | null = null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Clerk отдаёт JWT не мгновенно (шаблон генерируется асинхронно) — пробуем 3 раза.
async function mintClerkToken(bridge: AuthBridge, template?: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const token = await bridge.getToken(template)
    if (token) return token
    log('db', 'токен для БД не готов, повтор', { template: template ?? '(default)', attempt })
    await sleep(500)
  }
  return null
}

// Открывает новую сессию Surreal (app/signed-in → JWT-сессия, иначе guest).
// Возвращает ORM; при ошибке аутентификации кидает оригинальную ошибку.
async function openSession(needAuth: boolean, url: string, namespace: string, database: string, template?: string): Promise<NuxtgramDatabase> {
  const nextSession = new Surreal()

  try {
    if (needAuth) {
      const bridge = authBridge.value
      if (!bridge) {
        throw new Error('Auth bridge is not ready')
      }

      const token = await mintClerkToken(bridge, template)
      if (!token) {
        throw new Error('Не удалось получить Clerk JWT для подключения к базе')
      }

      log('db', 'подключаюсь к БД с JWT', { template: template ?? '(default)' })

      await nextSession.connect(url, {
        namespace,
        database,
        authentication: token,
      })

      if (!nextSession.accessToken) {
        throw new Error('БД отклонила Clerk JWT: проверьте claims ac/ns/db и audience в шаблоне JWT')
      }

      log('db', 'авторизованная сессия установлена')
    } else {
      log('db', 'подключаюсь анонимно')
      await nextSession.connect(url, { namespace, database })
      log('db', 'анонимная сессия установлена')
    }
  } catch (error) {
    await nextSession.close().catch(() => {})
    throw error
  }

  session = { client: nextSession, authed: needAuth }
  return createNuxtgramDatabase(nextSession)
}

// Подключается к SurrealDB (единственная точка входа data-слоя на клиенте).
// needAuth=true → авторизованная сессия с Clerk JWT; needAuth=false → анонимная (guest).
// Кэширует подключение в module-level session/connection: один сокет + один ORM.
// Если режим (authed/аноним) поменялся — закрывает старый сокет и переподключается.
// Новый пользователь (Clerk-аккаунт создан, записи users ещё нет) получает от БД
// NotAllowedError — тогда профиль провижинится через worker и сессия откроется вновь.
export const useSurrealDb = () => {
  const config = useRuntimeConfig()

  const connect = async (needAuth = authBridge.value?.isSignedIn.value === true): Promise<NuxtgramDatabase> => {
    if (!import.meta.client) {
      throw new Error('SurrealDB client access is only available in the browser')
    }

    const url = config.public.SURREALDB_URL
    const namespace = config.public.SURREALDB_NAMESPACE
    const database = config.public.SURREALDB_DATABASE

    if (!url || !namespace || !database) {
      throw new Error('SurrealDB configuration is incomplete')
    }

    if (session && session.client.isConnected && session.authed === needAuth) {
      return createNuxtgramDatabase(session.client)
    }

    if (connection) return connection

    connection = (async () => {
      if (session?.client.isConnected) {
        await session.client.close()
        session = null
      }

      try {
        return await openSession(needAuth, url, namespace, database, config.public.CLERK_JWT_TEMPLATE || undefined)
      } catch (error) {
        // БД отклонила JWT: у авторизованного пользователя это значит, что запись
        // users с этим clerkId ещё не создана (AUTHENTICATE требует её существовать).
        // Провижиним профиль через worker (тот ходит сервисным аккаунтом) и повторим.
        if (needAuth && error instanceof NotAllowedError) {
          const bridge = authBridge.value
          const username = bridge?.clientUsername.value
          if (username) {
            log('db', 'профиль не найден, провижиню через worker', { username })
            await bridge.provision(username)
            return await openSession(needAuth, url, namespace, database, config.public.CLERK_JWT_TEMPLATE || undefined)
          }
        }
        throw error
      }
    })()

    try {
      return await connection
    } catch (error) {
      logError('db', 'connect упал', error)
      throw error
    } finally {
      connection = null
    }
  }

  // Голый клиент Surreal, если сессия живая (иначе null).
  // Нужен для low-level операций (live-queries, raw SQL) поверх ORM.
  const getClient = () => {
    if (!import.meta.client) return null
    if (!session || !session.client.isConnected) return null
    return session.client
  }

  // Принудительно закрывает текущую сессию (например, при логауте).
  // Следующий connect() поднимет новый сокет.
  const close = async () => {
    if (!session) return
    await session.client.close()
    session = null
  }

  // ВАЖНО: никаких `.fetch('avatar')` — surqlize ломает парсинг на fetched media-объектах
  // (Expected Option<RecordId<media>>). Аватар подтягиваем отдельным запросом + hydrateUserAvatar.
  // Ищет юзера по clerkId (привязка аккаунта Clerk к записи users).
  // Возвращает строку с гидратированным аватаром или undefined.
  const getUserByClerkId = async (clerkId: string): Promise<UserRow | undefined> => {
    const db = await connect()

    const rows = (await db
      .select('users')
      .where((user) => user.clerkId.eq(clerkId))
      .limit(1)) as unknown as UserRow[]
    if (!rows[0]) return undefined

    await hydrateUserAvatar(db, rows)
    return rows[0]
  }

  // Ищет юзера по никнейму (используется при заходе в профиль по ссылке).
  const getUserByNickname = async (nickname: string): Promise<UserRow | undefined> => {
    const db = await connect()

    const rows = (await db
      .select('users')
      .where((user) => user.nickname.eq(nickname))
      .limit(1)) as unknown as UserRow[]
    if (!rows[0]) return undefined

    await hydrateUserAvatar(db, rows)
    return rows[0]
  }

  // Проверка уникальности никнейма: true, если он ещё не занят.
  // Используется на странице регистрации (live-валидация поля).
  const isNicknameAvailable = async (nickname: string): Promise<boolean> => {
    return !(await getUserByNickname(nickname))
  }

  // Обновляет профиль юзера (username/nickname/bio) по clerkId.
  // Возвращает обновлённую строку (с аватаром) или undefined, если юзер не найден.
  const updateUserByClerkId = async (
    clerkId: string,
    data: Pick<UserRow, 'username' | 'nickname' | 'bio'>,
  ): Promise<UserRow | undefined> => {
    const db = await connect()

    const rows = (await db
      .update('users')
      .where((user) => user.clerkId.eq(clerkId))
      .merge(data)
      .return('after')) as unknown as UserRow[]
    if (!rows[0]) return undefined

    await hydrateUserAvatar(db, rows)
    return rows[0]
  }

  return {
    connect,
    close,
    getClient,
    getUserByClerkId,
    getUserByNickname,
    isNicknameAvailable,
    updateUserByClerkId,
  }
}