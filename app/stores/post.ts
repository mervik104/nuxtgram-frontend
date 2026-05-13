import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiFetch } from '../composables/useApiFetch'
import type { ICreatePostRequest, IPost, IPostResponse, IPostsResponse } from '../types/PostTypes'
import type { IReactionRequest } from '../types/ReactionTypes'
import type { IPaginationMeta } from '~/types/CommonTypes'

export const usePostStore = defineStore('postsStore', () => {
    const { apiFetch } = useApiFetch()
    const posts = ref<Record<string, IPost>>({})
    const feeds = ref<Record<string, {
        ids: string[]
        meta: IPaginationMeta | null
        isLoading: boolean
        isFullyLoaded: boolean
    }>>({})

    const isCreateModalOpen = ref(false)
    const isEditModalOpen = ref(false)
    const isEditingPost = ref<IPost | null>(null)
    const isSubmitting = ref(false)

    function openCreateModal() { isCreateModalOpen.value = true }
    function openEditModal(post: IPost) { isEditingPost.value = post; isEditModalOpen.value = true }
    function closeModals() { isCreateModalOpen.value = false; isEditModalOpen.value = false; isEditingPost.value = null }

    function adjustFeedTotalDocs(feedKey: string, delta: number) {
        const feed = feeds.value[feedKey]
        if (feed?.meta) {
            feed.meta = {
                ...feed.meta,
                totalDocs: feed.meta.totalDocs + delta
            }
        }
    }

    function extractPost(data: IPostResponse | IPost, isFormData: boolean): IPost {
        return isFormData ? data as IPost : (data as IPostResponse).doc!
    }

    function getFeedList(feedKey: string): IPost[] {
        const feed = feeds.value[feedKey]
        if (!feed) return []
        return feed.ids.map(id => posts.value[id]).filter((p): p is IPost => Boolean(p))
    }

    function canLoadMore(feedKey: string): boolean {
        const feed = feeds.value[feedKey]
        if (!feed || !feed.meta) return true
        return feed.ids.length < feed.meta.totalDocs
    }

    async function fetchFeed(feedKey: string, apiUrl: string, page: number = 1, limit: number = 10) {
        if (!feeds.value[feedKey]) {
            feeds.value[feedKey] = { ids: [], meta: null, isLoading: false, isFullyLoaded: false }
        }

        const feed = feeds.value[feedKey]
        if (feed.isLoading || feed.isFullyLoaded) return

        if (page === 1) {
            feed.ids = []
            feed.isFullyLoaded = false
        }

        feed.isLoading = true
        try {
            const data = await apiFetch<IPostsResponse>(`${apiUrl}&page=${page}&limit=${limit}`)

            data.docs.forEach(post => {
                posts.value[post.id] = post
            })

            const newIds = data.docs.map(p => p.id).filter(id => !feed.ids.includes(id))
            feed.ids.push(...newIds)

            const { docs, ...restData } = data
            feed.meta = restData as unknown as IPaginationMeta

            if (data.docs.length < limit) {
                feed.isFullyLoaded = true
            }
        } finally {
            feed.isLoading = false
        }
    }

    async function getGlobalFeed(page = 1) {
        return fetchFeed('global', '/posts?sort=-createdAt', page)
    }

    async function getPost(postId: string) {
        const data = await apiFetch<IPost>(`posts/${postId}`)
        posts.value[postId] = data
        return data
    }

    async function getUserFeed(userId: string, page = 1) {
        return fetchFeed(`user_${userId}`, `/posts?where[author][equals]=${userId}&sort=-createdAt`, page)
    }

    async function createPost(payload: ICreatePostRequest | FormData) {
        isSubmitting.value = true

        const isFormData = payload instanceof FormData
        const url = isFormData ? '/posts/create-with-media' : '/posts'

        if (!isFormData) {
            payload.content = normalizeText(payload.content)
        } else {
            const content = payload.get('content') as string
            payload.set('content', normalizeText(content))
        }

        try {
            const data = await apiFetch<IPostResponse | IPost>(url, {
                method: 'POST',
                body: payload
            })
            
            const newPost = extractPost(data, isFormData)
            if (!newPost) throw new Error("Сервер не вернул созданный пост")

            posts.value[newPost.id] = newPost

            if (feeds.value['global']) {
                feeds.value['global'].ids.unshift(newPost.id)
                adjustFeedTotalDocs('global', 1)
            }

            const userFeedKey = `user_${newPost.author.id}`
            if (feeds.value[userFeedKey]) {
                feeds.value[userFeedKey].ids.unshift(newPost.id)
                adjustFeedTotalDocs(userFeedKey, 1)
            }

            closeModals()
            return newPost
        } finally {
            isSubmitting.value = false
        }
    }

    async function editPost(payload: ICreatePostRequest, id: string) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)
        try {
            const data = await apiFetch<IPostResponse>(`/posts/${id}`, { method: 'PATCH', body: payload })

            if (data.doc) {
                posts.value[id] = data.doc
            }

            closeModals()
        } finally {
            isSubmitting.value = false
        }
    }

    async function deletePost(id: string) {
        isSubmitting.value = true
        try {
            await apiFetch(`/posts/${id}`, { method: 'DELETE' })

            delete posts.value[id]

            for (const key of Object.keys(feeds.value)) {
                const feed = feeds.value[key]
                if (!feed) continue

                feed.ids = feed.ids.filter(pid => pid !== id)
                adjustFeedTotalDocs(key, -1)
            }
        } finally {
            isSubmitting.value = false
        }
    }

    async function toggleReaction(reaction: IReactionRequest) {
        if (reaction.target.relationTo === 'comments') return

        const post = posts.value[reaction.target.value]
        if (!post) return
        if (!reaction.type) return

        const oldReaction = post.myReaction
        const oldCount = post.reactionsCount[reaction.type] || 0

        if (oldReaction) {
            post.reactionsCount[oldReaction]--
            post.myReaction = null
        } else {
            post.reactionsCount[reaction.type] = oldCount + 1
            post.myReaction = reaction.type
        }

        try {
            await apiFetch('/reactions/toggle', { method: 'POST', body: reaction })
        } catch (er) {
            post.myReaction = oldReaction
            if (oldReaction) {
                post.reactionsCount[oldReaction]++
            } else {
                post.reactionsCount[reaction.type] = oldCount
            }
            throw er
        }
    }

    return {
        posts,
        feeds,
        isCreateModalOpen,
        isEditModalOpen,
        isEditingPost,
        isSubmitting,
        getPost,
        openCreateModal,
        openEditModal,
        closeModals,
        getFeedList,
        canLoadMore,
        getGlobalFeed,
        getUserFeed,
        createPost,
        editPost,
        deletePost,
        toggleReaction
    }
})