import { Table, type LiveMessage, type LiveSubscription } from 'surrealdb'
import { useAuthStore } from '~/stores/auth'
import { useCommentStore } from '~/stores/comment'
import { useFollowsStore } from '~/stores/follows'
import { usePostStore } from '~/stores/post'
import { useSurrealDb } from '~/data/surreal/useSurrealDb'
import { log, logError } from '~/utils/logger'

// Realtime-плагин: подписки LIVE на все таблицы через рекорд-сессию БД.
//
// Как это работает:
//  - LIVE-подписки создаются ТОЛЬКО в авторизованной сессии (guest-сессия не
//    подписывается — SurrealDB отклоняет live для анонима/работает нестабильно,
//    поэтому перед подпиской всегда connect(true) + проверка isSignedIn).
//  - Каждое LIVE-сообщение приходит в формате { action, recordId, value }.
//    Здесь мы НЕ дальше-рисуем данные руками: для CREATE/UPDATE/DELETE просто
//    помечаем пост/коммент «грязным» и через короткий debounce перечитываем
//    свежие данные (silent refresh), чтобы не дублировать собственную
//    оптимистичную вставку и не ловить рассинхрон со счётчиком.
//  - Каждое полученное сообщение дополнительно логируется (area=realtime,
//    msg=«событие») — так проще отлаживать без живой проверки в двух окнах.
//
// Генерация (generation) защищает от гонок при смене сессии: если во время
// установки подписок произошло stop/start (сигн-ин/out), старые подписки
// убиваются, новые live-хендлеры при старой генерации отбрасываются.
export default defineNuxtPlugin(() => {
    if (!import.meta.client) return

    const postStore = usePostStore()
    const commentStore = useCommentStore()
    const followsStore = useFollowsStore()
    const authStore = useAuthStore()

    let started = false
    let generation = 0
    let subscriptions: LiveSubscription[] = []
    const postRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>()
    const commentRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>()

    // Строковое представление record-id из LIVE-события (RecordId-объект → 'table:id').
    function recordString(value: unknown): string {
        if (value && typeof value === 'object' && 'id' in value) {
            const record = value as { table?: unknown; id: unknown }
            const recordTable = 'table' in record && record.table ? String(record.table) : ''
            return recordTable ? `${recordTable}:${String(record.id)}` : String(record.id)
        }
        return String(value ?? '')
    }

    // Краткое описание LIVE-события для логов (action + id + связанные записи).
    function describeMessage(message: LiveMessage): Record<string, unknown> {
        const summary: Record<string, unknown> = {
            action: message.action,
            id: recordString(message.recordId),
        }
        const value = message.value as Record<string, unknown> | undefined
        if (value) {
            for (const key of ['out', 'in', 'author', 'post']) {
                if (value[key] != null) summary[key] = recordString(value[key])
            }
        }
        return summary
    }

    // Планирует перечитывание поста через 150мс (debounce на серию событий);
    // onLoaded вызывается с обновлённым постом для до-обработки (вставка в ленты).
    function schedulePostRefresh(postId: string, onLoaded?: (post?: Awaited<ReturnType<typeof postStore.getPost>>) => void) {
        const existing = postRefreshTimers.get(postId)
        if (existing) clearTimeout(existing)
        postRefreshTimers.set(postId, setTimeout(async () => {
            postRefreshTimers.delete(postId)
            if (!authBridge.value?.isSignedIn.value) return
            try {
                const fresh = await postStore.getPost(postId)
                onLoaded?.(fresh)
                log('realtime', 'пост обновлён', { postId })
            } catch (error) {
                logError('realtime', 'обновление поста упало', error)
            }
        }, 150))
    }

    // Планирует «тихое» обновление ленты комментариев поста через 200мс,
    // затем — сам пост (вдруг счётчики изменились).
    function scheduleCommentRefresh(postId: string) {
        const existing = commentRefreshTimers.get(postId)
        if (existing) clearTimeout(existing)
        commentRefreshTimers.set(postId, setTimeout(async () => {
            commentRefreshTimers.delete(postId)
            if (!authBridge.value?.isSignedIn.value) return
            try {
                await commentStore.refreshComments(postId)
                schedulePostRefresh(postId)
            } catch (error) {
                logError('realtime', 'обновление комментариев упало', error)
            }
        }, 200))
    }

    // Убирает удалённую запись из всех лент (с коррекцией totalDocs).
    function removeFromFeed(feeds: Record<string, { ids: string[]; meta: { totalDocs: number } | null }>, id: string) {
        for (const key of Object.keys(feeds)) {
            const feed = feeds[key]
            if (!feed) continue
            const before = feed.ids.length
            feed.ids = feed.ids.filter(item => item !== id)
            if (feed.ids.length !== before && feed.meta) {
                feed.meta.totalDocs = Math.max(0, feed.meta.totalDocs - 1)
            }
        }
    }

    // Handler постов: DELETE — убрать из кэша и лент; CREATE — перечитать и
    // вставить новичок в глобальную/авторскую ленту; UPDATE — перечитать.
    function onPost(message: LiveMessage) {
        if (message.action === 'KILLED') return
        const id = recordString(message.recordId)

        if (message.action === 'DELETE') {
            delete postStore.posts[id]
            removeFromFeed(postStore.feeds, id)
            return
        }

        if (message.action === 'CREATE') {
            schedulePostRefresh(id, (fresh) => {
                if (!fresh) return
                for (const key of ['global', `user_${fresh.author.id}`]) {
                    const feed = postStore.feeds[key]
                    if (!feed || feed.ids.includes(id)) continue
                    feed.ids.unshift(id)
                    if (feed.meta) feed.meta.totalDocs = feed.meta.totalDocs + 1
                }
            })
            return
        }

        schedulePostRefresh(id)
    }

    // Handler реакций на посты: менялся счётчик — перечитываем пост.
    function onPostReaction(message: LiveMessage) {
        if (message.action === 'KILLED') return
        const postId = recordString(message.value?.out ?? '')
        if (postId && postStore.posts[postId]) schedulePostRefresh(postId)
    }

    // Убирает комментарий из ленты поста (со счётчиком).
    function removeCommentFromFeed(postId: string, commentId: string) {
        const feed = commentStore.feeds[postId]
        if (!feed) return
        const before = feed.ids.length
        feed.ids = feed.ids.filter(item => item !== commentId)
        if (feed.ids.length !== before && feed.meta) {
            feed.meta.totalDocs = Math.max(0, feed.meta.totalDocs - 1)
        }
    }

    // Handler комментариев: DELETE — вычистить; CREATE/UPDATE — обновить ленту
    // поста (или перечитать пост, если лента комментариев не открыта). Свои же
    // добавления (CREATE, известный id) не трогаем — у store есть кэш.
    function onComment(message: LiveMessage) {
        if (message.action === 'KILLED') return
        const id = recordString(message.recordId)
        const known = commentStore.comments[id]
        const postId = known?.post.id || recordString(message.value?.post ?? '')

        if (message.action === 'DELETE') {
            if (known) delete commentStore.comments[id]
            if (postId) removeCommentFromFeed(postId, id)
            if (postId && postStore.posts[postId]) schedulePostRefresh(postId)
            return
        }

        if (message.action === 'CREATE' && known) return
        if (!postId) return

        if (commentStore.feeds[postId]) {
            scheduleCommentRefresh(postId)
        } else if (postStore.posts[postId]) {
            schedulePostRefresh(postId)
        }
    }

    // Handler реакций на комментарии: обновляем ленту комментариев родительского поста.
    function onCommentReaction(message: LiveMessage) {
        if (message.action === 'KILLED') return
        const commentId = recordString(message.value?.out ?? '')
        const comment = commentStore.comments[commentId]
        if (comment?.post?.id) scheduleCommentRefresh(comment.post.id)
    }

    // Handler подписок: пересчитываем профили обеих сторон ребра + свой.
    function onFollow(message: LiveMessage) {
        if (message.action === 'KILLED') return
        const targetId = recordString(message.value?.in ?? '')
        const sourceId = recordString(message.value?.out ?? '')
        const ids = new Set([targetId, sourceId].filter(Boolean))
        for (const uid of ids) {
            followsStore.getFollows(uid)
        }
        if (authStore.user?.id) followsStore.getFollows(authStore.user.id)
    }

    // Handler users: при изменении профиля (аватар/имя) перечитываем все его посты.
    function onUser(message: LiveMessage) {
        if (message.action !== 'UPDATE' && message.action !== 'CREATE') return
        const userId = recordString(message.recordId)
        for (const id of Object.keys(postStore.posts)) {
            if (postStore.posts[id]?.author?.id === userId) schedulePostRefresh(id)
        }
    }

    // Поднимает LIVE-подписки в авторизованной сессии (connect(true)).
    // При смене генерации во время установки — созданные подписки убиваются.
    async function startRealtime() {
        if (started) return
        try {
            const db = await useSurrealDb().connect(true)
            const client = useSurrealDb().getClient()
            if (!client) {
                log('realtime', 'клиент БД недоступен, подписки не созданы')
                return
            }

            started = true
            const gen = generation

            const attach = async (what: string, handler: (message: LiveMessage) => void) => {
                try {
                    const sub = await client.live(new Table(what))
                    if (gen !== generation || !started) {
                        sub.kill().catch(() => {})
                        return
                    }
                    subscriptions.push(sub)
                    sub.subscribe((message) => {
                        log('realtime', 'событие', describeMessage(message))
                        handler(message)
                    })
                } catch (error) {
                    logError('realtime', `подписка ${what} не создалась`, error)
                }
            }

            await Promise.all([
                attach('posts', onPost),
                attach('comments', onComment),
                attach('post_reactions', onPostReaction),
                attach('comment_reactions', onCommentReaction),
                attach('follows', onFollow),
                attach('users', onUser),
            ])

            log('realtime', 'LIVE-подписки установлены', { count: subscriptions.length })
        } catch (error) {
            logError('realtime', 'запуск realtime упал', error)
        }
    }

    // Гарантированно гасит подписки, таймеры refresh и увеличивает generation,
    // чтобы «протухшие» хендлеры новой сессии не применялись.
    async function stopRealtime() {
        generation++
        started = false
        for (const timer of postRefreshTimers.values()) clearTimeout(timer)
        for (const timer of commentRefreshTimers.values()) clearTimeout(timer)
        postRefreshTimers.clear()
        commentRefreshTimers.clear()

        const subs = subscriptions
        subscriptions = []
        if (subs.length === 0) return
        await Promise.all(subs.map(sub => sub.kill().catch(() => {})))
        log('realtime', 'LIVE-подписки остановлены', { killed: subs.length })
    }

    watch(
        [
            () => authBridge.value?.isLoaded.value,
            () => authBridge.value?.isSignedIn.value,
            () => authBridge.value?.userId.value,
        ],
        async () => {
            const bridge = authBridge.value
            if (!bridge || !bridge.isLoaded.value) return

            await stopRealtime()

            if (!bridge.isSignedIn.value || !bridge.userId.value) {
                log('realtime', 'не авторизован, подписки не нужны')
                return
            }

            await startRealtime()
        },
        { immediate: true },
    )
})