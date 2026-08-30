import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IComment, ICommentsResponse } from '../types/comment.types.ts'
import type { IReactionRequest } from '../types/reaction.types'
import type { ICreateCommentRequest, IPost } from '../types/post.types'
import type { IPaginationMeta } from '~/types/common.types'
import { usePostStore } from './post'
import { useSurrealDb } from '~/data/surreal/useSurrealDb'
import type { AuthBridge } from '~/utils/authBridge'
import { flipReaction, snapshotReaction } from '~/utils/reaction'
import { log, logError } from '~/utils/logger'
import { useAuthStore } from './auth'
import {
    createComment as createSurrealComment,
    deleteComment as deleteSurrealComment,
    findCommentsPage,
    toggleCommentReaction as toggleSurrealCommentReaction,
    updateComment as updateSurrealComment,
} from '~/data/surreal/comments'

// Стор комментариев: кэш записей (comments) + постраничные ленты по постам
// (feeds). CRUD-операции работают через data-слой, реакции — оптимистично
// с откатом, счётчики комментариев зеркалятся в пост-сторе.
export const useCommentStore = defineStore('commentStore', () => {
    const clerkAuth = (): AuthBridge | null => authBridge.value
    const comments = ref<Record<string, IComment>>({})
    const feeds = ref<Record<string, {
        ids: string[]
        meta: IPaginationMeta | null
        isLoading: boolean
        isFullyLoaded: boolean
    }>>({})
    const postStore = usePostStore()

    const isSubmitting = ref(false)

    function openAuthPrompt() {
        useAuthStore().openAuthPrompt()
    }

    // Возвращает authed-сессию БД и id записи текущего юзера; бросает,
    // если Clerk не загружен или профиль не provisioned.
    async function currentSurrealUser() {
        const clerk = clerkAuth()
        if (!clerk?.isLoaded.value || !clerk.userId.value) {
            throw new Error('Сессия Clerk недоступна')
        }

        const surreal = useSurrealDb()
        const currentUser = await surreal.getUserByClerkId(clerk.userId.value)
        if (!currentUser) throw new Error('Application user profile is not provisioned')
        return { db: await surreal.connect(), id: String(currentUser.id) }
    }

    // Переносит в пост-стор свежие счётчики комментариев/реакций поста.
    function updatePost(post: IPost, postId: string) {
        if (postStore.posts[postId]) {
            postStore.posts[postId].commentsCount = post.commentsCount
            postStore.posts[postId].reactionsCount = post.reactionsCount
        }
    }

    // Корректирует totalDocs ленты комментариев (после создания/удаления).
    function adjustFeedTotalDocs(feedKey: string, delta: number) {
        const feed = feeds.value[feedKey]
        if (feed?.meta) {
            feed.meta = {
                ...feed.meta,
                totalDocs: feed.meta.totalDocs + delta
            }
        }
    }

    // Полный список комментариев поста (из кэша по id ленты).
    function getCommentsByPostId(postId: string): IComment[] {
        const feed = feeds.value[postId]
        if (!feed) return []
        return feed.ids.map(id => comments.value[id]).filter((c): c is IComment => Boolean(c))
    }

    // Есть ли ещё не загруженные комментарии (для индикатора «подгрузить»).
    function canLoadMoreComments(postId: string): boolean {
        const feed = feeds.value[postId]
        if (!feed || !feed.meta) return true
        return feed.ids.length < feed.meta.totalDocs
    }

    // Постраничная загрузка комментариев поста (page=1 — сброс ленты).
    // Защита от параллельных загрузок и повторных вызовов (isFullyLoaded).
    async function fetchComments(postId: string, page: number = 1, limit: number = 10) {
        if (!feeds.value[postId]) {
            feeds.value[postId] = { ids: [], meta: null, isLoading: false, isFullyLoaded: false }
        }

        const feed = feeds.value[postId]
        if (feed.isLoading || feed.isFullyLoaded) return

        if (page === 1) {
            feed.ids = []
            feed.isFullyLoaded = false
        }

        feed.isLoading = true
        try {
            if (!clerkAuth()?.isLoaded.value) return
            const surreal = useSurrealDb()
            const db = await surreal.connect()
            const data = await findCommentsPage(db, postId, clerkAuth()?.userId.value || undefined, page, limit)

            data.docs.forEach(comment => {
                comments.value[comment.id] = comment
            })

            feed.ids.push(...data.docs.map(c => c.id))

            const { docs, ...restData } = data
            feed.meta = restData as unknown as IPaginationMeta

            log('comment', 'комментарии получены', { postId, page, loaded: data.docs.length, total: feed.meta?.totalDocs })

            if (data.docs.length < limit) {
                feed.isFullyLoaded = true
            }
        } finally {
            feed.isLoading = false
        }
    }

    // «Тихое» обновление первой страницы комментариев: сохраняет локально
    // добавленные/не загруженные id (локально удалённые остаются на месте
    // до refresh), ошибки не выбрасываются наружу.
    async function refreshComments(postId: string) {
        const feed = feeds.value[postId]
        if (!feed) return

        feed.isFullyLoaded = false
        const prevIds = feed.ids.slice()
        try {
            if (!clerkAuth()?.isLoaded.value) return
            const surreal = useSurrealDb()
            const db = await surreal.connect()
            const data = await findCommentsPage(db, postId, clerkAuth()?.userId.value || undefined, 1, 10)

            data.docs.forEach(comment => {
                comments.value[comment.id] = comment
            })

            const serverIds = data.docs.map(c => c.id)
            const localOnly = prevIds.filter(id => !serverIds.includes(id))
            feed.ids = [...localOnly, ...serverIds]

            const { docs, ...restData } = data
            feed.meta = restData as unknown as IPaginationMeta
            feed.isFullyLoaded = data.docs.length < 10

            log('comment', 'комментарии тихо обновлены', { postId, loaded: data.docs.length, total: feed.meta?.totalDocs })
        } catch (error) {
            logError('comment', 'тихое обновление комментариев упало', error)
        }
    }

    // Создание комментария: пишем в БД, кладём в кэш и добавляем в начало
    // ленты поста (+totalDocs, +commentsCount в посте).
    async function createComment(payload: ICreateCommentRequest) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)

        try {
            const { db, id } = await currentSurrealUser()
            const newComment = await createSurrealComment(db, id, payload.post, payload.content)
            if (!newComment) throw new Error("Сервер не вернул созданный комментарий")

            comments.value[newComment.id] = newComment

            const postId = payload.post
            if (postId) {
                const feed = feeds.value[postId]
                if (feed && !feed.ids.includes(newComment.id)) {
                    feed.ids.unshift(newComment.id)
                    adjustFeedTotalDocs(postId, 1)
                    if (postStore.posts[postId]) postStore.posts[postId].commentsCount += 1
                }
            }
                
            return newComment
        } finally {
            isSubmitting.value = false
        }
    }

    // Редактирование текста комментария.
    async function editComment(payload: ICreateCommentRequest, commentId: string) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)

        try {
            const { db } = await currentSurrealUser()
            const updatedComment = await updateSurrealComment(db, commentId, payload.content, clerkAuth()?.userId.value || undefined)
            if (!updatedComment) throw new Error('Комментарий не найден')
            comments.value[commentId] = updatedComment
            log('comment', 'комментарий отредактирован', { commentId, myReaction: updatedComment.myReaction })
        } finally {
            isSubmitting.value = false
        }
    }

    // Удаление комментария: из БД, из кэша и из ленты поста (-totalDocs,
    // -commentsCount в посте, с защитой от отрицательного счётчика).
    async function deleteComment(postId: string, commentId: string) {
        isSubmitting.value = true
        try {
            const { db } = await currentSurrealUser()
            const deletedComment = await deleteSurrealComment(db, commentId)
            if (!deletedComment) throw new Error('Комментарий не найден')
            delete comments.value[commentId]
            const feed = feeds.value[postId]
            if (feed) {
                feed.ids = feed.ids.filter(id => id !== commentId)
                adjustFeedTotalDocs(postId, -1)
            }

            if (postStore.posts[postId]) postStore.posts[postId].commentsCount = Math.max(0, postStore.posts[postId].commentsCount - 1)

            return deletedComment
        } finally {
            isSubmitting.value = false
        }
    }

    // Переключение реакции на комментарии: оптимистично (snapshot → flip) с
    // полным откатом при ошибке. Без авторизации — модалка входа.
    async function toggleCommentReaction(reaction: IReactionRequest) {
        if (reaction.target.relationTo !== 'comments') return

        const comment = comments.value[reaction.target.value]
        if (!comment) return
        if (!reaction.type) return

        const clerk = clerkAuth()
        if (!clerk?.isLoaded.value || !clerk.userId.value) {
            log('reaction', 'лайк комментария блокирован (не авторизован), открываем промпт входа', { comment: reaction.target.value })
            openAuthPrompt()
            return
        }

        const previous = snapshotReaction(comment)
        const next = flipReaction(comment, reaction.type)
        comment.myReaction = next.myReaction
        comment.reactionsCount = next.reactionsCount

        try {
            const { db, id } = await currentSurrealUser()
            await toggleSurrealCommentReaction(db, id, reaction.target.value, reaction.type)
            log('reaction', 'лайк комментария успешен', { comment: reaction.target.value, myReaction: comment.myReaction })
        } catch (error) {
            comment.myReaction = previous.myReaction
            comment.reactionsCount = previous.reactionsCount
            logError('reaction', 'лайк комментария упал, откат', error)
            throw error
        }
    }

    return {
        comments,
        feeds,
        isSubmitting,
        refreshComments,
        getCommentsByPostId,
        canLoadMoreComments,
        fetchComments,
        createComment,
        editComment,
        deleteComment,
        toggleCommentReaction
    }
})
