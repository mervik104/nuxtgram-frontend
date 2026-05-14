<template>
    <div class="min-h-screen bg-base-dark text-white">
        <ProfileWrapper>
            <ProfileSkeleton v-if="isLoadingPage || !feedMeta || isProcess" />

            <template v-else-if="user">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-800">
                    <ProfileAvatar :user="user" :its-me="itsMe" />
                    <UserCard
                        :user="user"
                        :its-me="itsMe"
                        size="profile"
                        :feed-meta="feedMeta"
                        @openEditModalHandler="openEditProfileModal()"
                    />
                </div>
            </template>

            <div v-if="user" class="mt-6 flex flex-col gap-4">
                <h2 class="text-lg font-semibold text-gray-300 bg-base-dark py-2 z-10">
                    Публикации
                </h2>
                <InfiniteFeed :feed-key="`user_${user.id}`" />
            </div>

            <div v-else-if="!isFound" class="min-h-screen flex items-center justify-center text-gray-500 text-xl">
                <div class="text-center">
                    <p class="text-5xl mb-4">😢</p>
                    <p>Пользователь не найден</p>
                </div>
            </div>
        </ProfileWrapper>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useFollowsStore } from '~/stores/follows';
import { usePostStore } from '~/stores/post';
import type { IUser } from '~/types/UserTypes';

const userNick: string = useRoute().params.id as string
const authStore = useAuthStore()
const postStore = usePostStore()
const { feeds } = storeToRefs(postStore)

const { getUserByNickname, openEditProfileModal } = authStore
const { isProcess: isEditProcess, user: me } = storeToRefs(authStore)
const otherUserData = ref<IUser | null>(null)
const isLoadingPage = ref<boolean>(true)
const isFound = ref<boolean>(true)
const isProcess = computed(() => isLoadingPage.value || isEditProcess.value)
const itsMe = computed(() => me.value?.nickname === userNick)
const user = computed<IUser | null>(() => {
    return itsMe.value ? me.value : otherUserData.value
})

const feedMeta = computed(() => {
    if (!user.value) return null
    return feeds.value[`user_${user.value.id}`]?.meta ?? null
})

onMounted(async () => {
    if (itsMe.value) {
        isLoadingPage.value = false
        return
    }
    isLoadingPage.value = true
    const result = await getUserByNickname(userNick)
    otherUserData.value = result ? result : null
    isFound.value = !!result
    isLoadingPage.value = false
})

useHead({
    title: computed(() => {
        if (isLoadingPage.value) return 'Загрузка профиля...';
        if (!isFound.value) return 'Пользователь не найден';
        if (itsMe.value) return 'Мой Профиль';
        return `Профиль ${user.value?.username || 'Загрузка...'}`;
    })
})

</script>