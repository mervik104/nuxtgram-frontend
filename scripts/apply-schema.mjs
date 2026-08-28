import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Surreal } from 'surrealdb'

// Применяет миграцию database/surreal/001-infrastructure.surql к облачной
// SurrealDB (по умолчанию wss://…surreal.cloud/rpc, ns/db main/main).
// Креды — из env или worker/.dev.vars: SURREAL_APPLY_USERNAME / SURREAL_APPLY_PASSWORD.
// Также создаёт сервисного DB-юзера worker (SURREAL_SERVICE_USERNAME/PASSWORD).

const here = dirname(fileURLToPath(import.meta.url))
const surqlPath = join(here, '..', 'database', 'surreal', '001-infrastructure.surql')
const devVarsPath = join(here, '..', 'worker', '.dev.vars')

// Читает переменные формата KEY=VALUE из .dev.vars, минуя секреты в гите.
// Пропускается в CI/терминале, чтобы не конфликтовать с настоящими env.
function loadDevVars(path) {
  if (!process.env.CI && !process.env.TERM) {
    try {
      const raw = readFileSync(path, 'utf8')
      const out = {}
      for (const line of raw.split('\n')) {
        const eq = line.indexOf('=')
        if (eq > 0) out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
      }
      return out
    } catch {
      return {}
    }
  }
  return {}
}

const vars = loadDevVars(devVarsPath)

const username = process.env.SURREAL_APPLY_USERNAME || vars.SURREAL_APPLY_USERNAME
const password = process.env.SURREAL_APPLY_PASSWORD || vars.SURREAL_APPLY_PASSWORD

if (!username || !password) {
  console.error('Missing credentials. Put SURREAL_APPLY_USERNAME / SURREAL_APPLY_PASSWORD in worker/.dev.vars (gitignored) or env.')
  process.exit(1)
}

const URL = process.env.SURREALDB_URL_APPLY || 'wss://nuxtgram-databa-06g46rhocdvvd0fbbma22ik0fk.aws-use1.surreal.cloud/rpc'
const NAMESPACE = 'main'
const DATABASE = 'main'

// Разбивает SQL из .surql на отдельные стейтменты.
// Аккуратно: уважает строки в кавычках ('…' / "…" с экранированием), скобочную
// вложенность ({…}), комментарии '--' и не разрывает ';' внутри конструкций.
// Нужно, потому что облачный API не принимает пачкой несколько стейтментов.
function splitStatements(sql) {
  const out = []
  let current = ''
  let inDq = false
  let inSq = false
  let depth = 0
  let atLineStart = true
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (atLineStart && ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }
    const next = sql[i + 1]
    if (!inDq && !inSq && ch === '\\' && next === '"') {
      current += ch + next
      i++
      continue
    }
    if (!inSq && ch === '"' && (i === 0 || sql[i - 1] !== '\\')) inDq = !inDq
    if (!inDq && ch === "'" && (i === 0 || sql[i - 1] !== '\\')) inSq = !inSq
    if (!inDq && !inSq) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === ';' && depth === 0) {
        const trimmed = current.trim()
        if (trimmed && !trimmed.startsWith('--')) out.push(trimmed)
        current = ''
        continue
      }
    }
    current += ch
    atLineStart = ch === '\n'
  }
  const trimmed = current.trim()
  if (trimmed && !trimmed.startsWith('--')) out.push(trimmed)
  return out
}

const session = new Surreal()
await session.connect(URL, {
  namespace: NAMESPACE,
  database: DATABASE,
  authentication: { username, password },
})
console.log(`connected to ${URL} (ns=${NAMESPACE}, db=${DATABASE}) as "${username}"`)

const sql = readFileSync(surqlPath, 'utf8')
const statements = splitStatements(sql)
console.log(`\napplying ${statements.length} statements from 001-infrastructure.surql...`)

// Повторяем каждый стейтмент отдельным запросом; печатаем OK/FAIL по статусу.
let failed = 0
for (const statement of statements) {
  try {
    const res = await session.query(statement)
    const row = Array.isArray(res) ? res[0] : res
    if (row?.status === 'ERR' || row?.error) {
      failed++
      console.error(`  FAIL  ${statement.slice(0, 80)}...\n        ${row.error?.message ?? row.error ?? row.result}`)
    } else {
      console.log(`  OK    ${statement.slice(0, 70)}${statement.length > 70 ? '…' : ''}`)
    }
  } catch (e) {
    failed++
    console.error(`  FAIL  ${statement.slice(0, 80)}...\n        ${e.message}`)
  }
}
console.log(`\ndone: ${statements.length - failed} applied, ${failed} failed\n`)

// Опционально создаёт сервисного юзера БД, которым worker ходит в SurrealDB.
// Пропускается (с пометкой skip), если переменные не заданы.
const serviceUser = process.env.SURREAL_SERVICE_USERNAME || vars.SURREAL_SERVICE_USERNAME
const servicePassword = process.env.SURREAL_SERVICE_PASSWORD || vars.SURREAL_SERVICE_PASSWORD
if (serviceUser && servicePassword) {
  try {
    await session.query(
      `DEFINE USER ${serviceUser} ON DATABASE PASSWORD '${servicePassword.replace(/'/g, "\\'")}' ROLES OWNER;`,
    )
    console.log(`  OK    DEFINE USER "${serviceUser}" ON DATABASE (owner)`)
  } catch (e) {
    failed++
    console.error(`  FAIL  DEFINE USER "${serviceUser}" ON DATABASE\n        ${e.message}`)
  }
} else {
  console.log('  skip  service DB user (set SURREAL_SERVICE_USERNAME / SURREAL_SERVICE_PASSWORD to create)')
}

// Итоговая сводка: списки таблиц, доступов и полей БД после миграции.
const info = await session.query('INFO FOR DB;').then((r) => (Array.isArray(r) ? r[0] : r))
const result = info?.result ?? info
console.log('INFO FOR DB summary:')
console.log(`  tables:   ${Object.keys(result?.tables ?? {}).sort().join(', ') || '(none)'}`)
console.log(`  accesses: ${Object.keys(result?.accesses ?? {}).sort().join(', ') || '(none)'}`)
console.log(`  fields:   ${Object.keys(result?.fields ?? {}).slice(0, 12).join(', ')}${Object.keys(result?.fields ?? {}).length > 12 ? '…' : ''}`)

await session.close()