// Клиентский логгер (по файлам-«атмосферам» app/utils + tracing-плагин).
// Кэш флагов включения (readFlag); сбрасываются setDebug/тестами.
let enabled: boolean | null = null
let fileEnabled: boolean | null = null

// Лимиты ринг-буфера / отправки на сервер: кольцо держит до RING_MAX записей,
// на бэкенд уходят пачки по SEND_CHUNK каждые FLUSH_MS; содержимое data > 600 симв. ужимается.
const RING_MAX = 3000
const SEND_CHUNK = 500
const FLUSH_MS = 400
const MAX_DATA_CHARS = 600

// Уровень лога; от него зависит запись в консоль и файловую отправку.
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace'

// Одна запись лога: метка времени, монотонный seq, область, уровень, сообщение,
// приложенные данные, текущий маршрут и id сессии.
export interface LogEntry {
  ts: string
  seq: number
  area: string
  level: LogLevel
  msg: string
  data?: unknown
  route?: string
  session?: string
}

// Внутреннее состояние: ринг-буфер, счётчик записей, сессия, текущий маршрут,
// батч на отправку и его таймер.
let ring: LogEntry[] = []
let seq = 0
let sessionId = ''
let currentRoute = ''
let batch: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

// Определяет, включён ли лог (dev-режим или nuxtgram.debug в localStorage)
// и должен ли он уходить в /api/log (nuxtgram.debugfile=1). Результат кэшируется.
function readFlag(): { enabled: boolean; file: boolean } {
  if (enabled !== null && fileEnabled !== null) return { enabled, file: fileEnabled }

  let dev = false
  try {
    dev = typeof import.meta !== 'undefined' && (import.meta as { dev?: boolean }).dev === true
  } catch {
    dev = false
  }

  let stored = ''
  let file = false
  try {
    stored = typeof localStorage !== 'undefined' ? localStorage.getItem('nuxtgram.debug') ?? '' : ''
    file = typeof localStorage !== 'undefined' ? localStorage.getItem('nuxtgram.debugfile') === '1' : false
  } catch {
    stored = ''
    file = false
  }

  enabled = dev || stored !== ''
  fileEnabled = dev || file
  return { enabled, file: fileEnabled }
}

// Включает/выключает лог программно (например, из консоли через window.__ngDebug).
export function setDebug(on: boolean) {
  enabled = on
  if (!on) fileEnabled = false
}

// Включает/выключает файловую отправку пачек на бэкенд.
export function setDebugFile(on: boolean) {
  fileEnabled = on
}

// Возвращает id текущей лог-сессии (генерируется один раз, UUID или фолбэк).
export function getSessionId(): string {
  if (sessionId) return sessionId
  try {
    sessionId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  } catch {
    sessionId = `s-${Date.now()}`
  }
  return sessionId
}

// Запоминает текущий маршрут для всех последующих записей лога.
export function setCurrentRoute(route: string) {
  currentRoute = route
}

// Копия ринг-буфера (для дебаг-интерфейса и тестов).
export function getRing(): LogEntry[] {
  return ring.slice()
}

// Приводит аргументы к сериализуемому виду: Error → {kind, message, stack},
// Date → ISO-строка; большие объекты обрезаются (__truncated).
function normalizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg instanceof Error) return { kind: 'Error', message: arg.message, stack: arg.stack?.slice(0, 800) }
    if (arg instanceof Date) return arg.toISOString()
    if (arg === null || arg === undefined) return arg
    if (typeof arg === 'object') {
      try {
        const json = JSON.stringify(arg)
        if (json !== undefined) {
          if (json.length > MAX_DATA_CHARS) {
            return { __truncated: true, json: json.slice(0, MAX_DATA_CHARS) }
          }
          return arg
        }
        return String(arg)
      } catch {
        return String(arg)
      }
    }
    return arg
  })
}

// Собирает LogEntry из аргументов (нормализация, seq, маршрут, сессия).
function buildEntry(area: string, level: LogLevel, message: string, args: unknown[]): LogEntry {
  const data = normalizeArgs(args)
  return {
    ts: new Date().toISOString(),
    seq: ++seq,
    area,
    level,
    msg: message.slice(0, 2000),
    data: data.length === 1 ? data[0] : data.length > 1 ? data : undefined,
    route: currentRoute,
    session: getSessionId(),
  }
}

// Пишет запись в консоль (по уровню) и кладёт в ринг-буфер с лимитом.
function emit(entry: LogEntry, toConsole: boolean) {
  if (toConsole) {
    const area = `[ng:${entry.area}]`
    if (entry.level === 'error') console.error(area, entry.msg, entry.data ?? '')
    else if (entry.level === 'warn') console.warn(area, entry.msg, entry.data ?? '')
    else console.debug(area, entry.msg, entry.data ?? '')
  }

  ring.push(entry)
  if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX)
}

// Нужно ли отправлять пачки на бэкенд (включён файловый режим + есть window).
function shouldFlush(): boolean {
  return fileEnabled === true && typeof window !== 'undefined'
}

// Планирует отправку накопленной пачки; после флаша — снова, пока есть записи.
function scheduleFlush() {
  if (!shouldFlush()) return
  if (flushTimer || batch.length === 0) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushBatch().then(() => {
      if (batch.length > 0) scheduleFlush()
    })
  }, FLUSH_MS)
}

// Отправляет пачку (до SEND_CHUNK) в /api/log; сетевые сбои не критичны —
// данные сохраняются в ринг-буфере.
async function flushBatch() {
  if (batch.length === 0) return
  const payload = { session: sessionId, route: currentRoute, entries: batch.splice(0, SEND_CHUNK) }
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // потеряли пачку — некритично, ринг-буфер сохраняет данные
  }
}

// Единая точка: создаёт запись, эмитит и при файловом режиме кладёт в батч.
function record(area: string, level: LogLevel, message: string, args: unknown[], toConsole: boolean) {
  const entry = buildEntry(area, level, message, args)
  emit(entry, toConsole)
  if (shouldFlush()) {
    batch.push(entry)
    scheduleFlush()
  }
}

// Дублирует запись консольным в debug-уровне (эквивалент console.log).
export function log(area: string, message: string, ...args: unknown[]) {
  record(area, 'debug', message, args, true)
}

// Уровень info (более значимые события — логин, навигация).
export function logInfo(area: string, message: string, ...args: unknown[]) {
  record(area, 'info', message, args, true)
}

// Уровень warn (не штатные, но переживаемые ситуации).
export function logWarn(area: string, message: string, ...args: unknown[]) {
  record(area, 'warn', message, args, true)
}

// Уровень error (сбои; error сжимается до {kind, message, stack}).
export function logError(area: string, message: string, error?: unknown) {
  record(area, 'error', message, [error ?? ''], true)
}

// Уровень trace: пишется тихо (без консоли), используется для замеров.
export function logTrace(area: string, message: string, ...args: unknown[]) {
  record(area, 'trace', message, args, false)
}

// Замеряет время выполнения async-функции: trace с длительностью при успехе,
// error — при падении (исключение пробрасывается дальше).
export async function time<T>(area: string, label: string, fn: () => Promise<T>): Promise<T> {
  const start = patchNow()
  try {
    const result = await fn()
    logTrace(area, `${label} … ${plaintMs(nowMs() - start)}мс`)
    return result
  } catch (error) {
    logError(area, `${label} упал за ${plaintMs(nowMs() - start)}мс`, error)
    throw error
  }
}

// Монотонная метка времени (performance.now, если доступно).
function patchNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

// Текущее значение монотонных часов.
function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

// Форматирует миллисекунды в строку: µс для малых, секунды (с плавающей) для больших.
function plaintMs(value: number): string {
  return value >= 1000 ? (value / 1000).toFixed(2) : String(Math.round(value))
}

// Один раз навешивает window.error и unhandledrejection → логируются как error;
// повторный вызов игнорируется (флаг на window).
export function wireGlobalErrors() {
  if (typeof window === 'undefined' || (window as unknown as { __ngErrorsWired?: boolean }).__ngErrorsWired) return
  ;(window as unknown as { __ngErrorsWired?: boolean }).__ngErrorsWired = true

  window.addEventListener('error', (event) => {
    record('global', 'error', 'window error', [
      { message: event.message, file: event.filename, line: event.lineno, col: event.colno },
    ], true)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    record('global', 'error', 'unhandled rejection', [reason instanceof Error ? reason : { reason: String(reason) }], true)
  })
}

// экспортирую для тестов (чистая логика, без браузерных зависимостей)
// Внутренности модуля — экспортируются для юнит-тестов (чистая логика).
export const internals = {
  normalizeArgs,
  buildEntry,
  _reset() {
    ring = []
    seq = 0
    batch = []
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = null
    sessionId = ''
    currentRoute = ''
    enabled = null
    fileEnabled = null
  },
}

// Дебаг-хелперы на window: __ngDebug/__ngFile переключают флаги,
// __ngLogs возвращает записи ринг-буфера с seq > sinceSeq.
if (typeof window !== 'undefined') {
  const win = window as unknown as {
    __NG_DEBUG__?: boolean
    __NG_FILE__?: boolean
    __ngDebug?: (on?: boolean) => boolean
    __ngFile?: (on?: boolean) => boolean
    __ngLogs?: (sinceSeq?: number) => Array<Record<string, unknown>>
    __ngErrorsWired?: boolean
  }
  const flags = readFlag()
  win.__NG_DEBUG__ = flags.enabled
  win.__NG_FILE__ = flags.file
  win.__ngDebug = (on = true) => {
    setDebug(on)
    return on
  }
  win.__ngFile = (on = true) => {
    setDebugFile(on)
    return on
  }
  win.__ngLogs = (sinceSeq = 0) => ring.filter((e) => e.seq > sinceSeq).map((e) => ({ ...e }))
}