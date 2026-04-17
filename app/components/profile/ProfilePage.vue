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
                <ProfileUserInfo 
                @open-edit-modal-handler="openEditProfileModal()" 
                @subscribe-handler="subscribe"
                :user="user" :its-me="itsMe" />
            </div>
            <div class="mt-6 flex flex-col gap-4">
                <h2 class="text-lg font-semibold text-gray-300 top-0 bg-base-dark py-2 z-10">Публикации</h2>
                <InfiniteFeed :feed-key="`user_${user.id}`" />
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
import type { IUser } from '~/types/UserTypes';

const user = ref<IUser | null>()
const itsMe = ref<boolean>(false)
const isFound = ref<boolean>(true)
const userNick: string = useRoute().params.id as string
const authStore = useAuthStore()

const { getUserByNickname, user: me, openEditProfileModal } = authStore
const { isProcess } = storeToRefs(authStore)

onMounted(async () => {
    const result = await getUserByNickname(userNick)
    if (result) {
        user.value = result
        isFound.value = true
        itsMe.value = user.value.id === me?.id
    } else {
        user.value = null
        isFound.value = false
    }
})


const subscribe = () => {
    console.log('Подписаться')
}

</script>