import { defineStore } from "pinia"
import { useApiFetch } from '../composables/useApiFetch';
import { ref } from "vue";
import type { FollowsResponse, FollowType, UnfollowType } from "~/types/FollowsTypes";

export const useFollowsStore = defineStore('followsStore', () => {
    const { apiFetch } = useApiFetch()
    const isProcess = ref<boolean>(false)
    const currentFollows = ref<FollowsResponse | null>(null)

    async function getFollows(id: string) {
        currentFollows.value = null
        isProcess.value = true
        try {
            const follows = await apiFetch<FollowsResponse>(`/follows/user/${id}`, { method: 'GET' })
            currentFollows.value = follows
            return currentFollows
        } finally {
            isProcess.value = false
        }
    }

    async function follow(targetId: string) {
        if (currentFollows.value?.isFollowing) return
        isProcess.value = true
        currentFollows.value!.isFollowing = true
        currentFollows.value!.followersCount += 1
        try {
            await apiFetch<FollowType>(`/follows/follow`, { method: 'POST', body: { targetId } })
        } catch (e) {
            currentFollows.value!.isFollowing = false
            currentFollows.value!.followersCount -= 1
            throw e
        }
        finally {
            isProcess.value = false
        }
    }

    async function unfollow(targetId: string) {
        if (!currentFollows.value?.isFollowing) return
        isProcess.value = true
        currentFollows.value!.isFollowing = false
        currentFollows.value!.followersCount -= 1
        try {
            await apiFetch<UnfollowType>(`/follows/unfollow`, { method: 'DELETE', body: { targetId } })
        } catch (e) {
            currentFollows.value!.isFollowing = true
            currentFollows.value!.followersCount += 1
            throw e
        } finally {
            isProcess.value = false
        }
    }

    return {
        isProcess,
        currentFollows,
        unfollow,
        follow,
        getFollows
    }
}
)
