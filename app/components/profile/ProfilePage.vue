<template>
    <div v-if="isProcess" class="min-h-screen flex items-center justify-center">
        <TransitionDrop>
            <BaseLoader :is-center="true" v-if="isProcess" size="md" theme="muted" />
        </TransitionDrop>
    </div>

    <div v-else-if="user && isFound" class="min-h-screen bg-base-dark text-white">
        <ProfileWrapper>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-800">
                <ProfileAvatar :user="user" :its-me="itsMe" />
                <ProfileUserInfo v-if="feedMeta" :feed-meta="feedMeta"
                @open-edit-modal-handler="openEditProfileModal()" 
                @subscribe-handler="subscribe"
                :user="user" :its-me="itsMe" />
            </div>
            <div class="mt-6 flex flex-col gap-4">
                <h2 class="text-lg font-semibold text-gray-300 top-0 bg-base-dark py-2 z-10">Публикации</h2>
                <InfiniteFeed v-if="feedKey" :feed-key="feedKey" />
            </div>
        </ProfileWrapper>
    </div>
    <div v-else-if="!isFound && !isProcess" class="min-h-screen flex items-center justify-center text-gray-500 text-xl">
        <div class="text-center">
            <p class="text-5xl mb-4">😢</p>
            <p>Пользователь не найден</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { usePostStore } from '~/stores/post';
import type { IUser } from '~/types/UserTypes';

const userNick: string = useRoute().params.id as string
const authStore = useAuthStore()
const postStore = usePostStore()
const { feeds } = storeToRefs(postStore)

const { getUserByNickname, openEditProfileModal } = authStore
const { isProcess: isEditProcess, user: me } = storeToRefs(authStore)
const feedMeta = computed(() => feedKey.value && feeds.value[feedKey.value]?.meta)
const otherUserData = ref<IUser | null>(null)
const isLoadingPage = ref<boolean>(true)
const isFound = ref<boolean>(true)
const isProcess = computed(() => isLoadingPage.value || isEditProcess.value)
const itsMe = computed(() => me.value?.nickname === userNick)
const user = computed<IUser | null>(() => {
    return itsMe.value ? me.value : otherUserData.value
})
const feedKey = computed(() => user.value && `user_${user.value.id}`)

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

const subscribe = () => {
    console.log('Подписаться')
}

useHead({
    title: computed(() => {
        if (isLoadingPage.value) return 'Загрузка профиля...';
        if (!isFound.value) return 'Пользователь не найден';
        if (itsMe.value) return 'Мой профиль';
        return `Профиль ${user.value?.username || 'Загрузка...'}`;
    })
})

</script>