<template>
    <div class="w-250 mx-auto py-10">
        <div class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold">{{ title }}</h2>
            <div v-if="isLoadingPage">
                <UserlistSkeleton />
            </div>
            <div v-else-if="sortedUsers.length === 0" class="text-gray-400">{{ emptyText }}</div>
            <div v-else class="flex flex-col gap-3">
                <div v-for="user in sortedUsers" :key="user.id" class="cursor-pointer"
                    @click="navigateTo(`/profile/${user.nickname}`)">
                    <UserCard size="lg" :user="user" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { useFollowsStore } from '~/stores/follows';
import type { IUser } from '~/types/user.types';

const props = defineProps<{
    type: 'following' | 'followers'
}>()

const title = computed(() => props.type === 'following' ? 'Мои Подписки' : 'Мои Подписчики')
const emptyText = computed(() => props.type === 'following' ? 'Подписок пока нет.' : 'Подписчиков пока нет.')

const authStore = useAuthStore()
const followsStore = useFollowsStore()
const isLoadingPage = ref(true)
const sortedUsers = ref<IUser[]>([])

onMounted(async () => {
    const result = await authStore.getMe()
    const userId = result.value?.id
    if (userId) {
        await followsStore.getFollows(userId)
        const list = followsStore.follows[userId]?.[props.type] ?? []
        sortedUsers.value = [...list].sort((a, b) =>
            a.nickname.localeCompare(b.nickname)
        )
    }
    isLoadingPage.value = false
})

useHead({
    title: title.value
})
</script>