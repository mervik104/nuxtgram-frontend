import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { FollowsResponse } from "~/types/follows.types"
import { useAuthStore } from "./auth"
import {
    findUserFollows,
    followUser as followTargetUser,
    unfollowUser as unfollowTargetUser,
} from "~/data/surreal/follows"
import { useSurrealDb } from "~/data/surreal/useSurrealDb"
import { log, logError } from "~/utils/logger"

// Стор подписок: счётчики/статус isFollowing по профилям + оптимистичный
// follow/unfollow (с откатом при ошибке). Данные ключуются по id цели.
export const useFollowsStore = defineStore('followsStore', () => {
    const authStore = useAuthStore()

    const isFollowProcess = ref(false)
    const follows = ref<Record<string, FollowsResponse>>({})

    // При смене текущего юзера подтягиваем его собственный профиль подписок.
    watch(() => authStore.user?.id, async (userId) => {
        if (!userId) return
        await loadMeFollows()
    }, { immediate: true })

    // Загружает подписки текущего (своего) профиля в store.
    async function loadMeFollows() {
        const userId = authStore.user?.id
        if (!userId) return
        const response = await fetchFollows(userId)
        if (response) follows.value[userId] = response
    }

    // Запрос FollowsResponse для профиля (сетевые ошибки → null).
    async function fetchFollows(id: string): Promise<FollowsResponse | null> {
        try {
            const db = await useSurrealDb().connect()
            return await findUserFollows(db, id, authStore.user?.id)
        } catch {
            return null
        }
    }

    // Явная загрузка подписок профиля по id в store.
    async function getFollows(id: string) {
        const response = await fetchFollows(id)
        if (response) follows.value[id] = response
    }

    // Записаться на пользователя. Оптимистично: сразу isFollowing=true и
    // +1 к счётчику; при ошибке — откат и лог. Без авторизации — модалка входа.
    async function follow(targetId: string) {
        const currentUserId = authStore.user?.id
        if (!currentUserId) {
            log('follow', 'подписка блокирована (не авторизован), открываем промпт входа', { target: targetId })
            authStore.openAuthPrompt()
            return
        }
        if (!follows.value[targetId] || follows.value[targetId].isFollowing) return

        follows.value[targetId].isFollowing = true
        follows.value[targetId].followersCount += 1
        isFollowProcess.value = true

        try {
            const db = await useSurrealDb().connect()
            await followTargetUser(db, currentUserId, targetId)
            log('follow', 'подписка успешна', { target: targetId })
        } catch (e) {
            follows.value[targetId].isFollowing = false
            follows.value[targetId].followersCount -= 1
            logError('follow', 'подписка упала, откат', e)
        } finally {
            await loadMeFollows()
            isFollowProcess.value = false
        }
    }

    // Отписаться от пользователя. Зеркально follow: оптимистичный сброс
    // isFollowing/-1, откат при ошибке.
    async function unfollow(targetId: string) {
        const currentUserId = authStore.user?.id
        if (!currentUserId) {
            log('follow', 'отписка блокирована (не авторизован), открываем промпт входа', { target: targetId })
            authStore.openAuthPrompt()
            return
        }
        if (!follows.value[targetId] || !follows.value[targetId].isFollowing) return

        follows.value[targetId].isFollowing = false
        follows.value[targetId].followersCount -= 1
        isFollowProcess.value = true

        try {
            const db = await useSurrealDb().connect()
            await unfollowTargetUser(db, currentUserId, targetId)
            log('follow', 'отписка успешна', { target: targetId })
        } catch (e) {
            follows.value[targetId].isFollowing = true
            follows.value[targetId].followersCount += 1
            logError('follow', 'отписка упала, откат', e)
        } finally {
            await loadMeFollows()
            isFollowProcess.value = false
        }
    }

    return { isFollowProcess, follows, getFollows, follow, unfollow }
})