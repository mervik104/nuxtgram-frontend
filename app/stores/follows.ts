import type { FollowsResponse, FollowType, UnfollowType } from "~/types/follows.types"
import { useAuthStore } from "./auth"

export const useFollowsStore = defineStore('followsStore', () => {
    const { apiFetch } = useApiFetch()
    const authStore = useAuthStore()

    const isFollowProcess = ref(false)
    const follows = ref<Record<string, FollowsResponse>>({})

    watch(() => authStore.user?.id, async (userId) => {
        if (!userId) return
        await loadMeFollows()
    }, { immediate: true })

    async function loadMeFollows() {
        const userId = authStore.user?.id
        if (!userId) return
        const response = await fetchFollows(userId)
        if (response) follows.value[userId] = response
    }

    async function fetchFollows(id: string): Promise<FollowsResponse | null> {
        try {
            return await apiFetch<FollowsResponse>(`/follows/user/${id}`, { method: 'GET' })
        } catch {
            return null
        }
    }

    async function getFollows(id: string) {
        const response = await fetchFollows(id)
        if (response) follows.value[id] = response
    }

    async function follow(targetId: string) {
        if (!follows.value[targetId] || follows.value[targetId].isFollowing) return

        follows.value[targetId].isFollowing = true
        follows.value[targetId].followersCount += 1
        isFollowProcess.value = true

        try {
            await apiFetch<FollowType>(`/follows/follow`, { method: 'POST', body: { targetId } })
        } catch (e) {
            follows.value[targetId].isFollowing = false
            follows.value[targetId].followersCount -= 1
            throw e
        } finally {
            await loadMeFollows()
            isFollowProcess.value = false
        }
    }

    async function unfollow(targetId: string) {
        if (!follows.value[targetId] || !follows.value[targetId].isFollowing) return

        follows.value[targetId].isFollowing = false
        follows.value[targetId].followersCount -= 1
        isFollowProcess.value = true

        try {
            await apiFetch<UnfollowType>(`/follows/unfollow`, { method: 'DELETE', body: { targetId } })
        } catch (e) {
            follows.value[targetId].isFollowing = true
            follows.value[targetId].followersCount += 1
            throw e
        } finally {
            await loadMeFollows()
            isFollowProcess.value = false
        }
    }

    return { isFollowProcess, follows, getFollows, follow, unfollow }
})