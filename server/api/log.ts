// Серверная запись браузерных логов в файлы (клиент шлёт пачки через /api/log).
//
// Формат строки — JSON (ts/seq/level/area/msg/data/route/session), суммируемый
// грепом. Уровни берутся из записи, поэтому:
//  - logs/app-YYYY-MM-DD.log      — всё КРОМЕ trace (нормальная читаемая лента),
//  - logs/app-trace-YYYY-MM-DD.log— только trace (рендер-шум, ~десятки тыс. строк),
//  - logs/app-errors-YYYY-MM-DD.log — только error (быстрый поиск инцидентов;
//    подмножество главного файла, дублируется для удобства).
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Одна запись лога, приходящая с клиента (JSON-serializable).
interface LogEntry {
  ts: string
  seq: number
  area: string
  level: string
  msg: string
  data?: unknown
  route?: string
  session?: string
}

// Порог длины одной записи и максимум записей в батче (защита от абьюза).
const MAX_ENTRY_CHARS = 2000
const MAX_BATCH = 200

// Обрезает значение до max символов с пометкой '…truncated(N)',
// чтобы файлы логов не раздувались (строки и JSON проходят по-разному).
function truncate(value: unknown, max: number): unknown {
  const raw = typeof value === 'string' ? value : JSON.stringify(value)
  const text = raw ?? String(value)
  if (text.length <= max) return value
  return text.slice(0, max) + `…truncated(${text.length})`
}

// Санитизация значения перед записью: срезает ANSI-коды, обрезает строки,
// ограничивает число полей объекта и размер каждого из них.
function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return value.replace(/\x1b\[[0-9;]*m/g, '').slice(0, MAX_ENTRY_CHARS)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as object).slice(0, 40)) {
      out[key] = truncate((value as Record<string, unknown>)[key], 1000)
    }
    return out
  }
  return value
}

// Каталог логов относительно корня проекта (process.cwd()).
function logDir(): string {
  return join(process.cwd(), 'logs')
}

// Имя файла по шаблону '<suffix>-YYYY-MM-DD.log'.
function fileName(suffix: string, date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${suffix}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.log`
}

// Дописывает строку в файл лога (создаёт каталог при необходимости).
// Ошибки записи не роняют запрос — только console.error.
function writeLine(file: string, json: string) {
  try {
    const dir = logDir()
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, file), json + '\n', 'utf8')
  } catch (error) {
    console.error('[nglog] файловая запись упала:', (error as Error)?.message ?? error)
  }
}

// POST /api/log — приём пачки браузерных логов и разложка по файлам по уровню:
//  - всё кроме trace → app-*.log,
//  - trace → app-trace-*.log,
//  - error → app-errors-*.log (дубликат подмножества главного файла).
// Ответ 204; лимиты MAX_BATCH/MAX_ENTRY_CHARS защищают от переполнения.
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const raw = await readBody<{ session?: string; route?: string; entries?: LogEntry[] }>(event).catch(() => undefined)
  const entries = Array.isArray(raw?.entries) ? raw.entries.slice(0, MAX_BATCH) : []

  for (const entry of entries) {
    if (!entry || typeof entry.area !== 'string' || typeof entry.msg !== 'string') continue
    const level = entry.level || 'debug'
    const line = {
      ts: entry.ts || new Date().toISOString(),
      seq: typeof entry.seq === 'number' ? entry.seq : null,
      session: (entry.session || raw?.session || '').slice(0, 64),
      route: (entry.route || raw?.route || '').slice(0, 512),
      level,
      area: entry.area.slice(0, 64),
      msg: truncate(entry.msg, MAX_ENTRY_CHARS),
      data: sanitize(entry.data),
    }
    const json = JSON.stringify(line)
    const date = new Date()

    // Главная лента — без trace, чтобы не утонуть в рендер-шуме.
    if (level !== 'trace') writeLine(fileName('app', date), json)
    // Рендер/прочий trace — отдельно, для профилирования при необходимости.
    if (level === 'trace') writeLine(fileName('app-trace', date), json)
    // Ошибки — отдельный файл-дубликат главной ленты для быстрого триажа.
    if (level === 'error') writeLine(fileName('app-errors', date), json)
  }

  return new Response(null, { status: 204 })
})