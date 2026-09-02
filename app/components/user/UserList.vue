<template>
    <div :class="styles.container()">
        <div :class="styles.wrapper()">
            <h2 :class="styles.title()">{{ title }}</h2>
            <div v-if="isLoadingPage">
                <UserlistSkeleton />
            </div>
            <div v-else-if="sortedUsers.length === 0" :class="styles.empty()">{{ emptyText }}</div>
            <div v-else :class="styles.list()">
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
import { tv } from 'tailwind-variants'

const userListVariants = tv({
    slots: {
        container: 'w-full max-w-5xl mx-auto px-2 sm:px-3 py-4',
        wrapper: 'flex flex-col gap-4',
        title: 'text-2xl sm:text-3xl font-bold text-icon-primary',
        empty: 'text-icon-secondary',
        list: 'flex flex-col gap-3',
    },
})
const styles = computed(() => userListVariants())

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