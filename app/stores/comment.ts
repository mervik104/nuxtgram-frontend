import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiFetch } from '../composables/useApiFetch'
import type { IComment, ICommentResponse, ICommentsResponse } from '../types/CommentTypes'
import type { IReactionRequest } from '../types/ReactionTypes'
import type { ICreateCommentRequest } from '../types/PostTypes'
import type { IPaginationMeta } from '~/types/CommonTypes'

const normalizeText = (text: string) => text.trim().replace(/\s+/g, ' ')

export const useCommentStore = defineStore('commentStore', () => {
    const { apiFetch } = useApiFetch()
    const comments = ref<Record<string, IComment>>({})
    const feeds = ref<Record<string, {
        ids: string[]
        meta: IPaginationMeta | null
        isLoading: boolean
        isFullyLoaded: boolean
    }>>({})

    const isSubmitting = ref(false)

    function adjustFeedTotalDocs(feedKey: string, delta: number) {
        const feed = feeds.value[feedKey]
        if (feed?.meta) {
            feed.meta = {
                ...feed.meta,
                totalDocs: feed.meta.totalDocs + delta
            }
        }
    }

    function getCommentsByPostId(postId: string): IComment[] {
        const feed = feeds.value[postId]
        if (!feed) return []
        return feed.ids.map(id => comments.value[id]).filter((c): c is IComment => Boolean(c))
    }

    function canLoadMoreComments(postId: string): boolean {
        const feed = feeds.value[postId]
        if (!feed || !feed.meta) return true
        return feed.ids.length < feed.meta.totalDocs
    }

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
            const data = await apiFetch<ICommentsResponse>(
                `comments?where[post][equals]=${postId}&limit=${limit}&page=${page}&sort=-createdAt`
            )

            data.docs.forEach(comment => {
                comments.value[comment.id] = comment
            })

            feed.ids.push(...data.docs.map(c => c.id))

            const { docs, ...restData } = data
            feed.meta = restData as unknown as IPaginationMeta

            if (data.docs.length < limit) {
                feed.isFullyLoaded = true
            }
        } catch (e) {
            console.error('Ошибка загрузки комментариев', e)
            throw e
        } finally {
            feed.isLoading = false
        }
    }

    async function createComment(payload: ICreateCommentRequest) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)

        try {
            const data = await apiFetch<ICommentResponse>('/comments?depth=4', {
                method: 'POST',
                body: payload,
            })

            const newComment = data.doc
            if (!newComment) throw new Error("Сервер не вернул созданный комментарий")

            comments.value[newComment.id] = newComment

            const postId = payload.post
            if (postId) {
                const feed = feeds.value[postId]
                if (feed) {
                    feed.ids.unshift(newComment.id)
                    adjustFeedTotalDocs(postId, 1)
                }
            }

            return newComment
        } catch (e) {
            throw e
        } finally {
            isSubmitting.value = false
        }
    }

    async function editComment(payload: ICreateCommentRequest, commentId: string) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)

        try {
            const data = await apiFetch<ICommentResponse>(`/comments/${commentId}?depth=4`, {
                method: 'PATCH',
                body: payload,
            })

            if (data.doc) {
                comments.value[commentId] = data.doc
            }
        } catch (e) {
            throw e
        } finally {
            isSubmitting.value = false
        }
    }

    async function deleteComment(postId: string, commentId: string) {
        isSubmitting.value = true
        try {
            await apiFetch(`/comments/${commentId}`, { method: 'DELETE' })
            delete comments.value[commentId]

            const feed = feeds.value[postId]
            if (feed) {
                feed.ids = feed.ids.filter(id => id !== commentId)
                adjustFeedTotalDocs(postId, -1)
            }
        } catch (e) {
            throw e
        } finally {
            isSubmitting.value = false
        }
    }

    async function toggleCommentReaction(reaction: IReactionRequest) {
        if (reaction.target.relationTo !== 'comments') return

        const comment = comments.value[reaction.target.value]
        if (!comment) return
        if (!reaction.type) return

        const oldReaction = comment.myReaction
        const oldCount = comment.reactionsCount[reaction.type] || 0

        if (oldReaction) {
            comment.reactionsCount[oldReaction]--
            comment.myReaction = null
        } else {
            comment.reactionsCount[reaction.type] = oldCount + 1
            comment.myReaction = reaction.type
        }

        try {
            await apiFetch('/reactions/toggle', { method: 'POST', body: reaction })
        } catch (er) {
            comment.myReaction = oldReaction
            if (oldReaction) {
                comment.reactionsCount[oldReaction]++
            } else {
                comment.reactionsCount[reaction.type] = oldCount
            }
            throw er
        }
    }

    return {
        comments,
        feeds,
        isSubmitting,
        getCommentsByPostId,
        canLoadMoreComments,
        fetchComments,
        createComment,
        editComment,
        deleteComment,
        toggleCommentReaction
    }
})