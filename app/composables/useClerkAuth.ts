// Обёртка над Clerk для работы приложения: получение JWT для SurrealDB,
// provision профиля на worker, загрузка медиа и состояние сессии.
export const useClerkAuth = () => {
  const auth = useAuth()
  const { user: clerkUser } = useUser()
  const config = useRuntimeConfig()

  // Дефолтное имя пользователя для provision: из Clerk-профиля (username),
  // иначе из локальной части email; если совсем короткое — 'user-<id>'.
  const clientUsername = computed(() => {
    const u = clerkUser.value
    if (!u) return undefined
    if (u.username) return u.username

    const email =
      u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress
    const base = email ? (email.split('@')[0] ?? '').replace(/[^a-z0-9_]/gi, '') : 'user'
    return base.length >= 3 ? base : `user-${u.id?.slice(-6)}`
  })

  // Достаёт Clerk JWT (шаблон необязателен) с ретраями: токен генерируется
  // асинхронно, поэтому пробуем до 8 раз с паузой 150ms. Возвращает null,
  // если так и не удалось (UI покажет ошибку).
  const getToken = async (template?: string) => {
    const get = () =>
      template
        ? auth.getToken.value({ template })
        : auth.getToken.value()

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const token = await get()
        if (token) {
          log('clerk', 'JWT получен', { template: template ?? '(default)', chars: token.length })
          return token
        }
      } catch (error) {
        logError('clerk', `getToken попытка ${attempt + 1} упала`, error)
      }
      log('clerk', 'JWT ещё не готов, retry', { attempt: attempt + 1, template: template ?? '(default)' })
      await new Promise((resolve) => setTimeout(resolve, 150))
    }

    log('clerk', 'JWT не получен за все ретраи', { template: template ?? '(default)' })
    return null
  }

// Токен для шаблона JWT из конфига (или дефолтный).
  const authToken = () => getToken(config.public.CLERK_JWT_TEMPLATE || undefined)

  // Создаёт профиль юзера (users) в БД через worker POST /auth/provision.
  // Повторные сетевые сбои (без 'response' — не ответ сервера) ретраются до 8 раз
  // с нарастающим интервалом; бизнес-ошибки пробрасываются сразу.
  const provision = async (username: string) => {
    const token = await authToken()
    if (!token) throw new Error('Не удалось получить сессию Clerk. Попробуйте войти.')

    const attempt = async () =>
      await $fetch<{ userId: string; created: boolean }>(
        `${config.public.WORKER_URL}/auth/provision`,
        {
          method: 'POST',
          timeout: 20000,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: { username },
        },
      )

    for (let tryCount = 0; tryCount < 8; tryCount++) {
      try {
        return await attempt()
      } catch (error) {
        const isNetwork = typeof error === 'object' && error !== null && !('response' in error)
        if (!isNetwork) throw error
        log('clerk', `provision: сетевой сбой, попытка ${tryCount + 1}`, { error: String(error) })
        if (tryCount < 7) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (tryCount + 1)))
        }
      }
    }

    throw new Error('Не удалось связаться с сервером профилей. Проверьте интернет и попробуйте ещё раз.')
  }

  // Выход из Clerk (логаут в приложении делает authStore/logout).
  const signOut = async () => {
    await auth.signOut.value()
  }

  // Универсальный POST к worker с авторизацией Bearer-токеном Clerk.
  const requestWorker = async <T>(
    path: string,
    options: { method: 'POST'; body?: Record<string, unknown> },
  ): Promise<T> => {
    const token = await authToken()
    if (!token) throw new Error('Clerk session is not available')

    const result = await $fetch<T>(`${config.public.WORKER_URL}${path}`, {
      ...options,
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return result as T
  }

  // Загружает файл изображения на worker (POST /media/upload) с JWT.
  // Возвращает objectKey/publicUrl и метаданные media из SurrealDB.
  const uploadImage = async (
    filename: string,
    contentType: string,
    file: Blob | ArrayBuffer,
  ): Promise<{ objectKey: string; publicUrl: string; size: number; media: { id: string } }> => {
    const token = await authToken()
    if (!token) throw new Error('Clerk session is not available')

    const body = file instanceof Blob ? await file.arrayBuffer() : file
    const params = new URLSearchParams({ filename, contentType })

    const result = await $fetch<{ objectKey: string; publicUrl: string; size: number; media: { id: string } }>(
      `${config.public.WORKER_URL}/media/upload?${params.toString()}`,
      {
        method: 'POST',
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      },
    )
    return result
  }

  // Отладочный трассинг состояния Clerk (включается флагом nuxtgram.debug).
  watchEffect(() => {
    log('clerk', 'state', {
      isLoaded: auth.isLoaded.value,
      isSignedIn: auth.isSignedIn.value,
      userId: auth.userId.value,
      sessionId: auth.sessionId.value,
    })
  })

  return {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    userId: auth.userId,
    sessionId: auth.sessionId,
    getToken,
    provision,
    requestWorker,
    uploadImage,
    signOut,
    clientUsername,
  }
}