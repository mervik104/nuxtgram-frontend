import type { Pinia, Store } from 'pinia'
import { log, logError, logInfo, logTrace, setCurrentRoute, wireGlobalErrors } from '~/utils/logger'
import type { Router } from 'vue-router'
import { authBridge } from '~/utils/authBridge'

// Клиентский трейсер (только когда включён nuxtgram.debug в localStorage):
// логирует навигацию, действия/мутации сторах, клики и нажатия клавиш, fetch,
// long-task'и и жизнь components (mount/update/activated). Данные идут в /api/log.

const INSTALLED = Symbol('ng-traced')

// Человекочитаемое имя компонента для логов (из его опций).
function componentLabel(instance: Record<string, unknown>): string {
  const options = (instance.$options ?? {}) as Record<string, unknown>
  const name =
    options.__name || options.name || options._componentTag || options.__file || 'anon'
  return typeof name === 'string' ? name : 'anon'
}

// Подключает трассировку стор-мутаций ($subscribe) и действий ($onAction).
  // Защита от двойной установки через символ-маркер INSTALLED.
  function wireStore(store: Store) {
  if ((store as unknown as Record<symbol, boolean>)[INSTALLED]) return
  Object.defineProperty(store as unknown as Record<symbol, boolean>, INSTALLED, { value: true })

  store.$subscribe(
    (mutation, state) => {
      const events = Array.isArray(mutation.events) ? mutation.events : []
      const changed = events.map((ev) => String((ev as { key?: string })?.key).replace(/^_/, ''))
      logTrace('store', `[${store.$id}] ${mutation.type}`, {
        changed: changed.slice(0, 40),
        stateKeys: Object.keys(state).slice(0, 40),
      })
    },
    { detached: true },
  )

  store.$onAction(({ name, args, after, onError }) => {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    logTrace('action', `start [${store.$id}] ${name}`, args)
    after((result) => {
      const duration = Math.round((performance.now() - start) * 10) / 10
      logInfo('action', `done [${store.$id}] ${name} ${duration}мс`, { duration })
      if (result) logTrace('action', `result [${store.$id}] ${name}`, result)
    })
    onError((error) => {
      const duration = Math.round((performance.now() - start) * 10) / 10
      logError('action', `failed [${store.$id}] ${name} ${duration}мс`, error)
    })
  })
}

// Логирует клики и нажатия клавиш на странице (в capture-фазе,
  // чтобы ловить даже клики по перехватываемым элементам).
  function wireClickClicks() {
  const summarize = (target: EventTarget | null): Record<string, string | number> | undefined => {
    if (!(target instanceof HTMLElement)) return undefined
    const text = target.innerText?.trim().slice(0, 80) ?? ''
    return {
      tag: target.tagName.toLowerCase(),
      id: target.id || '',
      text,
      classes: (target.className?.toString?.() ?? '').slice(0, 120),
    }
  }

  window.addEventListener(
    'click',
    (event) => {
      logTrace('ui', 'click', summarize(event.target) ?? {})
    },
    { capture: true },
  )

  window.addEventListener(
    'keydown',
    (event) => {
      logTrace('ui', 'key', { key: event.key, code: event.code, ctrl: event.ctrlKey, shift: event.shiftKey })
    },
    { capture: true },
  )
}

// Оборачивает window.fetch: логирует метод, url, статус и длительность;
  // сетевые сбои — в error. Собственные запросы к /api/log не пишутся.
  function wireFetch() {
  const original = window.fetch
  if (
    !original ||
    (window as unknown as { __ngFetchWired?: boolean }).__ngFetchWired
  ) {
    return
  }
  ;(window as unknown as { __ngFetchWired?: boolean }).__ngFetchWired = true

  window.fetch = async (input, init) => {
    const start = performance.now()
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input instanceof Request ? input.url : String(input)

    const isLogSelf = url.includes('/api/log')

    try {
      const response = await original(input, init)
      const duration = Math.round((performance.now() - start) * 10) / 10
      if (!isLogSelf) {
        logTrace('fetch', `${init?.method ?? 'GET'} ${url.slice(0, 220)}`, {
          status: response.status,
          duration,
        })
      }
      return response
    } catch (error) {
      if (!isLogSelf) {
        logError('fetch', `FAILED ${init?.method ?? 'GET'} ${url.slice(0, 220)}`, error)
      }
      throw error
    }
  }
}

// Отслеживает long-task'и (блокировки главного потока) для поиска лагов.
  // Observer недоступен/упал — пропускаем молча (не критично).
  function wirePerfObservers() {
  if (typeof PerformanceObserver === 'undefined') return
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          logTrace('perf', 'longtask', { duration: Math.round(entry.duration * 10) / 10 })
        }
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    // не критично
  }
}

// Ключевая точка инициализации: только на клиенте.
  // Монтирует все wire-функции, следит за маршрутами, мостом Clerk, mixin
  // компонентов и pinia-сторами.
  export default defineNuxtPlugin(async (nuxtApp) => {
  if (typeof window === 'undefined') return

  wireGlobalErrors()
  wireFetch()
  wireClickClicks()
  wirePerfObservers()

  const router = (nuxtApp as unknown as { $router: Router }).$router
  router.afterEach((to) => {
    setCurrentRoute(to.fullPath)
    logTrace('nav', `route → ${to.fullPath}`)
  })

  watch(authBridge, (bridge) => {
    if (bridge) {
      logInfo('clerk', 'authBridge установлен', {
        userId: bridge.userId.value,
        isSignedIn: bridge.isSignedIn.value,
        isLoaded: bridge.isLoaded.value,
        template: useRuntimeConfig().public.CLERK_JWT_TEMPLATE || '(default)',
      })
    } else {
      log('clerk', 'authBridge сброшен')
    }
  }, { immediate: true })

  const app = nuxtApp.vueApp
  app.mixin({
    mounted(this: unknown) {
      logTrace('render', `mount ${componentLabel(this as Record<string, unknown>)}`)
    },
    activated(this: unknown) {
      logTrace('render', `activated ${componentLabel(this as Record<string, unknown>)}`)
    },
    updated(this: unknown) {
      logTrace('render', `re-render ${componentLabel(this as Record<string, unknown>)}`)
    },
  })

  const pinia = (nuxtApp as unknown as { $pinia: Pinia }).$pinia
  pinia.use(({ store }) => {
    wireStore(store)
  })

  nuxtApp.hook('app:mounted', () => {
    const stores = ((pinia as Pinia & { _s?: Record<string, Store> })._s ?? {}) as Record<string, Store>
    for (const id of Object.keys(stores)) {
      const store = stores[id]
      if (store) wireStore(store)
    }
    logInfo('boot', 'трейсер готов', { stores: Object.keys(stores).length })
  })

  nuxtApp.hook('app:beforeMount', () => {
    logInfo('boot', 'SPA монтируется')
  })

  nuxtApp.hook('app:error', (error) => {
    logError('app', 'app error', error)
  })

  logInfo('boot', 'tracing plugin loaded')
})