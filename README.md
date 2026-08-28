# Nuxtgram

Social/photo-блог (Instagram-подобная лента): посты с картинками, лайки/реакции, комментарии, подписки, профили. Стек — полностью serverless: никакого собственного монолитного бэкенда, только сервисы-провайдеры.

## Project Overview

- **Frontend** — Nuxt SPA (Vue 3), отдаётся как статический single-page артефакт.
- **Аутентификация** — Clerk (аккаунты, сессии, JWT).
- **Данные** — SurrealDB (посты, комментарии, реакции, подписки, медиа-строки).
- **Файлы/медиа** — Cloudflare Worker + Backblaze B2 (загрузка, валидация, пресайн-ссылки).
- **Логи** — браузерный логгер пишет пачки в `/api/log` (локальный Nuxt-сервер), файлы раскладываются по `logs/`.

Роль frontend — единственное место, где живёт UI и клиентская (не security-critical) логика: он ходит в Clerk за JWT, в SurrealDB — за данными, в Worker — за медиа-операциями.

## Architecture

```text
Nuxt SPA
   ↓
Clerk
   ↓
Cloudflare Worker       →  SurrealDB
(pровижининг пользователя, media-операции)

Cloudflare Worker       →  Backblaze B2
(presigned URLs, uploads, ownership)
```

- **Nuxt SPA** — интерфейс. `ssr: false`, hash-роутер (`hashMode: true`), поэтому годится для статического хостинга (GitHub Pages через `nuxt-single-html`).
- **Clerk** — учётные записи, вход/регистрация через OAuth/email; выдаёт JWT по кастомному шаблону `surrealdb` (issuer + audience `nuxtgram-surrealdb`).
- **Cloudflare Worker** — проверяет Clerk JWT (issuer/audience/существование `sub`), провижинит пользователей в SurrealDB, выдает presigned-URL на загрузку/скачивание файлов, управляет медиа-строками (avatar/media), слушает `/api/...` (детали — `worker/`).
- **SurrealDB** — основное хранилище: `users`, `media`, `posts`, `comments`, рёбра `follows`, `post_reactions`, `comment_reactions`. Доступ из SPA — через `surrealdb` SDK с JWT-сессией Clerk (пользователь видит только свои данные; серверная авторизация на уровне per-field/пермишенов описывается в миграции `database/surreal/001-infrastructure.surql`).
- **Backblaze B2** — объектное хранилище картинок; обращения только через Worker (пресайн-URl, привязка объекта к владельцу), прямых публичных загрузок в bucket нет.

## Technology Stack

Сессия на `package.json` (актуально на 2026-08):

| Слой | Технологии |
| --- | --- |
| Frontend | Nuxt 4 (`nuxt@^4.3.0`), Vue 3.5, TypeScript 5.9 |
| State | Pinia (storеs через `@pinia/nuxt`) |
| UI | `@nuxt/ui` (UIkit), Tailwind CSS 4 + `tailwind-variants`, `@nuxtjs/color-mode`, `@nuxt/icon`, `nuxt-toast` |
| Forms | `vee-validate`, `@vee-validate/zod`, `zod` |
| Auth | `@clerk/nuxt` (3.0.15) |
| Данные | `surrealdb` 2.0.8, `surqlize` 0.1.0 |
| Утилиты | `@vueuse/nuxt`, `@formkit/auto-animate`, `tailwind-merge` |
| Build | Nuxt + `nuxt-single-html` (статический single-page выход), `vue-tsc` |
| Тесты | `bun:test` (`tests/`) |

**Migration/History:** раньше Nuxtgram использовал self-hosted Payload CMS (Next.js + MongoDB) как бэкенд. Он удалён из активного проекта и сохранён отдельно в архиве — см. `docs/plans.md` и legacy-репозиторий `nuxtgram-backend`.

## Project Structure

```text
app/
├── assets/css/           # глобальные стили (main.css)
├── components/           # UI-компоненты (auth, comment, layout, post, profile, shared, ui, user)
├── composables/          # hooks: авторизация, скролл, модалки, infinite scroll, nickname check и т.д.
├── data/
│   └── surreal/          # data-слой SurrealDB: ids, client (surqlize ORM), schema, mappers,
│                         #   avatars, follows, comments, posts, useSurrealDb (сессия+подписки)
├── layouts/              # layout (default.vue)
├── middleware/           # auth.global.ts — глобальный роут-гард авторизации
├── pages/                # маршруты: feed, profile, subscribers, subscriptions, login, register, index
├── plugins/              # auth (Clerk↔Pinia), realtime (LIVE-подписки SurrealDB), tracing, scroll-manager
├── schemas/              # zod-схемы валидации форм (auth.ts)
├── stores/               # Pinia: auth, post, comment, follows
├── types/                # типы данных (user/post/comment/common/reaction)
├── utils/                # чистые функции: logger, formats, normalizeText, pluralize, clipboard,
│   │                     #   reaction, dom, redirects, resetState, authBridge, ui/atoms (tv-токены)
└── app.vue, spa-loading-template.html

server/
└── api/log.ts            # приём браузерных логов (пачки → logs/app-*.log)

worker/                   # Cloudflare Worker (media + провижининг): src/index.ts, src/pure.ts, wrangler.jsonc
database/surreal/         # миграции схемы SurrealDB (001-infrastructure.surql)
scripts/                  # apply-schema.mjs, patch-surqlize.mjs, surreal-e2e.mjs
tests/                    # юнит-тесты (bun:test): ids, mappers, schema, reaction, formats, state, logger, dom, redirects
docs/                     # TODO-security.md, data-layer.md, plans.md, rules.md
```

Назначение ключевых директорий:

- `app/data/surreal` — весь доступ к БД и типизированный ORM (surqlize) поверх SurrealDB SDK; изменения схемы тут же попадают в `schema.ts`.
- `app/plugins/realtime` — LIVE-подписки на изменения (`users`, `posts`, `comments`, `follows`, реакции), инкрементальное обновление кэшей стора.
- `worker` — отдельно деплоящийся сервис (см. `worker/wrangler.jsonc`), не часть Nuxt-билда.
- `server` — только лог-эндпоинт (не бизнес-бэкенд).

## Authentication

- **Clerk (`@clerk/nuxt`)** — вход/регистрация (email, пароль, OAuth), управление сессией, publishable-ключ в env.
- Приложение работает через **authBridge** (`app/utils/authBridge.ts`) — реактивный мост, который Clerk подставляет в `shallowRef`. Отсюда берутся `userId/isLoaded/isSignedIn`, `getToken(template)`, `provision(username)`, `requestWorker(...)`.
- **JWT**: `getToken('surrealdb')` отдаёт токен по кастомному шаблону Clerk (issuer `https://superb-marmot-2888.clerk.accounts.dev`, audience `nuxtgram-surrealdb`). Этот же токен идёт в SurrealDB (аутентификация сессии) и в Worker (проверка JWT).
- **Frontend → Worker**: Worker проверяет issuer/audience/`sub`, затем от имени пользователя делает провижининг и медиа-операции.
- **Authorization boundary**: граница безопасности — Worker и серверные пермишены SurrealDB (`DEFINE PERMISSION`/SCHEMAFULL в миграции). Клиентский UI не считается границей; secrets не переносятся во frontend.
- Роут-гард `app/middleware/auth.global.ts` дожидается загрузки Clerk и направляет неавторизованных на `/login`.

## Database

- **SurrealDB** — документно-графовая БД; SDK `surrealdb` + ORM `surqlize`.
- Таблицы: `users`, `media`, `posts`, `comments`; рёбра: `follows`, `post_reactions`, `comment_reactions` (схема — `app/data/surreal/schema.ts`, миграция — `database/surreal/001-infrastructure.surql`).
- **Доступ через JWT-сессию**: SPA аутентифицируется в БД тем же Clerk-JWT (template `surrealdb`), поэтому пользователь видит только те данные, которые разрешают server-side permissions. Данные маппятся в публичные типы через `app/data/surreal/mappers.ts` (например, media-строка → `IAvatarType`).
- **Ограничение**: никакие права не строятся на стороне клиента; считывать/писать — только через то, что разрешает схема.

## File Storage

- **Backblaze B2** — объектное хранилище (bucket `nuxtgram-basket`, endpoint и публичный base-URL в `worker/wrangler.jsonc`).
- **Cloudflare Worker** — вся файловая логика:
  - валидация JWT и ownership (владелец = `sub`), размеры через `MAX_UPLOAD_BYTES`;
  - presigned-URLs на загрузку/скачивание (TTL `B2_SIGNED_URL_TTL_SECONDS`);
  - коррекция метаданных после загрузки, удаление файла/аватара, media/avatar-строки в БД.
- Картинки хранятся **только server-side** по объектным ключам; публичные URL отдаются через B2 base + ключ, пресайн-URLы — только авторизованным.
- Подробности структуры API Worker — в `worker/src/index.ts` (потоки `uploadUrl/uploadBytes/complete…/provision…`).

## Environment Variables

### Frontend (`nuxtgram-frontend/.env`)

| Переменная | Назначение | Где используется |
| --- | --- | --- |
| `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Публичный ключ Clerk | `@clerk/nuxt` (весь фронтенд) |
| `NUXT_PUBLIC_SURREALDB_URL` | URL RPC-эндпоинта SurrealDB | `app/data/surreal/useSurrealDb.ts` |
| `NUXT_PUBLIC_SURREALDB_NAMESPACE` | Namespace (по умолчанию `main`) | data-слой |
| `NUXT_PUBLIC_SURREALDB_DATABASE` | Database (по умолчанию `main`) | data-слой |
| `NUXT_PUBLIC_CLERK_JWT_TEMPLATE` | Имя JWT-шаблона Clerk (`surrealdb`) | `getToken(template)` |
| `NUXT_PUBLIC_WORKER_URL` | URL медиа-Worker | `authBridge.requestWorker/uploadImage` |
| `API_URL` | Legacy-остаток эпохи Payload (база для относительных URL `buildApiUrl`) | `app/composables/useApiBuilder.ts` (все новые URL — абсолютные B2, префикс не используется) |

В `nuxt.config.ts` runtimeConfig.public отображает `process.env.*` в одноимённые ключи; значения из `.env` подставляются Nuxt через `NUXT_PUBLIC_*` (для ключей `SURREALDB_*`, `CLERK_JWT_TEMPLATE`, `WORKER_URL`, `API_URL`).

### Worker (`nuxtgram-frontend/worker` — wrangler secrets/vars)

Public vars: `CLERK_ISSUER`, `CLERK_JWKS_URL`, `CLERK_AUDIENCE`, `SURREALDB_URL/NAMESPACE/DATABASE`, `B2_ENDPOINT`, `B2_BUCKET_NAME`, `B2_PUBLIC_BASE_URL`, `B2_SIGNED_URL_TTL_SECONDS`, `S3_REGION`, `MAX_UPLOAD_BYTES`.

**Secrets (хранятся в `wrangler secret put`, не коммитятся):** `B2_KEY_ID`, `B2_APPLICATION_KEY`, `SURREALDB_SERVICE_USERNAME`, `SURREALDB_SERVICE_PASSWORD`.

## Development

Команды (из `package.json`):

```bash
bun install            # установка зависимостей (postinstall: nuxt prepare + patch-surqlize.mjs)
bun run dev            # nuxt dev (локальный сервер на :3000)
bun run build          # nuxt build (production)
bun run generate       # nuxt generate — статический single-file выход (для GH Pages)
bun run preview        # nuxt preview — предпросмотр сгенерированного
bun run typecheck      # tsc -p .nuxt/tsconfig.app.json
bun test tests/        # юнит-тесты (bun:test)
bunx tsc --noEmit      # typecheck полный (альтернативный; также в worker/)
```

Требуется локально: Node/Bun, Docker (для локального SurrealDB — см. `database/`), `.env` (по образцу `.env.example`), у Worker — `wrangler` и `wrangler secret put …` для секретов.

## Deployment

- **Frontend**: собирается командой `bun run generate` → `nuxt-single-html` даёт один статический HTML (hash-роутер, без SSR). Хостится на любом статическом хостинге (GitHub Pages / прочее). CI-конфигурации пока нет.
- **Worker**: `wrangler deploy` из `worker/` (см. `worker/wrangler.jsonc`); для production нужны все секреты выше и суженный CORS — см. `docs/TODO-security.md` (сейчас временно `ACAO: *` для LAN-разработки).
- Перед прод: задать боевой `FRONTEND_ORIGIN`/домен в CORS Worker, выставить production-ключи Clerk.

## Security

- **Clerk authentication** — вся аутентификация (пароли, OAuth, сессии) на стороне Clerk; SDK-ключи только публичные.
- **JWT** — единый токен Clerk (template `surrealdb`), проверяется в Worker (issuer+audience) и отдаётся в SurrealDB.
- **Worker authorization** — JWT-верификация, ownership (владелец `sub`), валидация размеров/типов, пресайн-URLы с TTL.
- **SurrealDB permissions** — пермишены по схеме (`database/surreal/001-infrastructure.surql`); сессии только через JWT.
- **B2 security** — доступ к объектам только через Worker; credentials не публикуются и не попадают в frontend.
- **Secrets** — ни один секрет не хранится в коде/репо фронтенда (см. `.env.example`, `.gitignore`, `docs/TODO-security.md`).

## Migration Status

Nuxtgram мигрировал с legacy Payload CMS (self-hosted backend: Next.js + MongoDB) на serverless-архитектуру: Nuxt SPA + Clerk + Cloudflare Worker + SurrealDB + Backblaze B2.

Старый Payload-бэкенд сохранён отдельно как **legacy repository** исключительно для истории и reference:

> https://github.com/mervik104/nuxtgram-backend

Актуальный проект живёт здесь:
> https://github.com/mervik104/nuxtgram-frontend