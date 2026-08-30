import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ICreatePostRequest, IPost } from '../types/post.types'
import type { IReactionRequest } from '../types/reaction.types'
import type { IPaginationMeta } from '~/types/common.types'
import { createPost as createSurrealPost, deletePost as deleteSurrealPost, findPostById, findPostsPage, togglePostReaction, updatePost as updateSurrealPost } from '~/data/surreal/posts'
import { useSurrealDb } from '~/data/surreal/useSurrealDb'
import type { AuthBridge } from '~/utils/authBridge'
import { flipReaction, snapshotReaction } from '~/utils/reaction'
import { log, logError } from '~/utils/logger'
import { useAuthStore } from './auth'

// Стор постов: кэш записей (posts) + ленты (feeds: global / user_<id>) с
// постраничной подгрузкой, CRUD и оптимистичными реакциями с откатом.
export const usePostStore = defineStore('postsStore', () => {
    const clerkAuth = (): AuthBridge | null => authBridge.value
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

    function openAuthPrompt() {
        useAuthStore().openAuthPrompt()
    }

    // Управление модалками создания/редактирования поста.
    function openCreateModal() { isCreateModalOpen.value = true }
    function openEditModal(post: IPost) { isEditingPost.value = post; isEditModalOpen.value = true }
    function closeModals() { isCreateModalOpen.value = false; isEditModalOpen.value = false; isEditingPost.value = null }

    // Корректирует totalDocs ленты после создания/удаления поста.
    function adjustFeedTotalDocs(feedKey: string, delta: number) {
        const feed = feeds.value[feedKey]
        if (feed?.meta) {
            feed.meta = {
                ...feed.meta,
                totalDocs: feed.meta.totalDocs + delta
            }
        }
    }

    // Полный список постов ленты (из кэша по id).
    function getFeedList(feedKey: string): IPost[] {
        const feed = feeds.value[feedKey]
        if (!feed) return []
        return feed.ids.map(id => posts.value[id]).filter((p): p is IPost => Boolean(p))
    }

    // Есть ли неподгруженные посты в ленте.
    function canLoadMore(feedKey: string): boolean {
        const feed = feeds.value[feedKey]
        if (!feed || !feed.meta) return true
        return feed.ids.length < feed.meta.totalDocs
    }

    // Постраничная загрузка ленты (feedKey, опц. authorId для профиля).
    // page=1 сбрасывает ленту; защита от параллельных/повторных загрузок.
    async function fetchSurrealFeed(feedKey: string, authorId: string | undefined, page = 1, limit = 10) {
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
            const db = await useSurrealDb().connect()
            const data = await findPostsPage(db, {
                authorId,
                clerkId: clerkAuth()?.userId.value || undefined,
                page,
                limit,
            })

            data.docs.forEach(post => {
                posts.value[post.id] = post
            })

            const newIds = data.docs.map(post => post.id).filter(id => !feed.ids.includes(id))
            feed.ids.push(...newIds)
            const { docs, ...restData } = data
            feed.meta = restData as IPaginationMeta
            feed.isFullyLoaded = !data.hasNextPage
            log('feed', 'фид получен', { feedKey, page, loaded: newIds.length, total: feed.meta?.totalDocs })
        } catch (error) {
            logError('feed', 'загрузка фида упала', error)
            throw error
        } finally {
            feed.isLoading = false
        }
    }

    // Глобальная лента (все посты, новые сверху).
    async function getGlobalFeed(page = 1) {
        return fetchSurrealFeed('global', undefined, page)
    }

    // Один пост по id (для страницы поста / редиректа к посту).
    async function getPost(postId: string) {
        const db = await useSurrealDb().connect()
        const post = await findPostById(db, postId, clerkAuth()?.userId.value || undefined)
        if (!post) return undefined
        posts.value[postId] = post
        return post
    }

    // Лента постов конкретного автора (профиль), ключ user_<userId>.
    async function getUserFeed(userId: string, page = 1) {
        return fetchSurrealFeed(`user_${userId}`, userId, page)
    }

    // Создание поста. Принимает простой payload или FormData (с файлами):
    // для FormData файлы загружаются через worker и конвертируются в imageIds.
    // Нормализует текст (normalizeText). Новый пост вставляется в начало лент.
    async function createPost(payload: ICreatePostRequest | FormData) {
        isSubmitting.value = true

        const isFormData = payload instanceof FormData

        if (!isFormData) {
            payload.content = normalizeText(payload.content)
        } else {
            const content = payload.get('content') as string
            payload.set('content', normalizeText(content))
        }

        try {
            const surreal = useSurrealDb()
            const currentUser = await surreal.getUserByClerkId(clerkAuth()?.userId.value || '')
            if (!currentUser) throw new Error('Application user profile is not provisioned')
            const db = await surreal.connect()

            let newPost: IPost | undefined
            if (!isFormData) {
                newPost = await createSurrealPost(db, String(currentUser.id), payload.content)
            } else {
                const files = payload.getAll('image').filter((value): value is File => value instanceof File)
                const imageIds: string[] = []
                for (const file of files) {
                    const upload = await clerkAuth()!.uploadImage(file.name, file.type, file)

                    imageIds.push(upload.media.id)
                }

                newPost = await createSurrealPost(db, String(currentUser.id), payload.get('content') as string, imageIds)
            }
            if (!newPost) throw new Error('Сервер не вернул созданный пост')

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

    // Редактирование текста поста.
    async function editPost(payload: ICreatePostRequest, id: string) {
        isSubmitting.value = true
        payload.content = normalizeText(payload.content)
        try {
            const db = await useSurrealDb().connect()
            const updatedPost = await updateSurrealPost(db, id, payload.content, clerkAuth()?.userId.value || undefined)
            if (!updatedPost) throw new Error('Пост не найден')
            posts.value[id] = updatedPost
            closeModals()
        } finally {
            isSubmitting.value = false
        }
    }

    // Удаление поста: из БД, кэша и из ВСЕХ лент (с корректировкой totalDocs).
    async function deletePost(id: string) {
        isSubmitting.value = true
        try {
            const db = await useSurrealDb().connect()
            const deletedPost = await deleteSurrealPost(db, id)
            if (!deletedPost) throw new Error('Пост не найден')

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

    // Переключение реакции на пост: оптимистично (snapshot → flip) с полным
    // откатом при ошибке. Без авторизации — открываем модалку входа.
    async function toggleReaction(reaction: IReactionRequest) {
        if (reaction.target.relationTo === 'comments') return

        const post = posts.value[reaction.target.value]
        if (!post) return
        if (!reaction.type) return

        const clerk = clerkAuth()
        if (!clerk?.isLoaded.value || !clerk.userId.value) {
            log('reaction', 'лайк поста блокирован (не авторизован), открываем промпт входа', { post: reaction.target.value })
            openAuthPrompt()
            return
        }

        const previous = snapshotReaction(post)
        const next = flipReaction(post, reaction.type)
        post.myReaction = next.myReaction
        post.reactionsCount = next.reactionsCount

        try {
            const surreal = useSurrealDb()
            const currentUser = await surreal.getUserByClerkId(clerk.userId.value)
            if (!currentUser) throw new Error('Application user profile is not provisioned')
            const db = await surreal.connect()
            await togglePostReaction(db, String(currentUser.id), reaction.target.value, reaction.type)
            log('reaction', 'лайк поста успешен', { post: reaction.target.value, myReaction: post.myReaction })
        } catch (error) {
            post.myReaction = previous.myReaction
            post.reactionsCount = previous.reactionsCount
            logError('reaction', 'лайк поста упал, откат', error)
            throw error
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
