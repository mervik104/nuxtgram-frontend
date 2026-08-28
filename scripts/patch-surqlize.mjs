// Patch типов surqlize: bypass блокирующего инференса t_infer.
//
// В surqlize есть `type t_infer<T> = infer<T>`, который из-за рекурсивного
// инференса несовместим с рабочими type-констрейнтами. Скрипт заменяет его на
// явную проверку веток (Workable → R['infer'], AbstractType → T['infer']).
// Запускать после (пере)установки node_modules: путь — surqlize/dist/*.d.ts.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'node_modules', 'surqlize', 'dist')

const bad = 'type t_infer<T extends AbstractType | Workable> = infer<T>;'
const good =
  'type t_infer<T extends AbstractType | Workable> = T extends Workable<WorkableContext, infer R> ? R["infer"] : T extends AbstractType ? T["infer"] : never;'

for (const file of ['index.d.ts', 'index.d.cts']) {
  const path = join(dist, file)
  let source = readFileSync(path, 'utf8')

  // Идемпотентность: если цель уже патчена/отсутствует — пропускаем файл.
  if (!source.includes(bad)) continue

  source = source.replace(bad, good)
  writeFileSync(path, source)
  console.log(`patched ${file}`)
}