<template>
    <div class="min-h-screen bg-surface-background text-icon-primary">
        <ProfileLayout>
            <ProfileSkeleton v-if="isLoadingPage || !feedMeta || isProcess" />

            <template v-else-if="user">
                <div class="pb-6 border-b border-border-subtle">
                    <div class="flex items-center justify-between sm:hidden mb-4">
                        <h2 class="text-lg font-semibold text-icon-primary">
                            {{ itsMe ? 'Мой профиль' : `Профиль ${user.username}` }}
                        </h2>
                        <DropdownMenu v-if="itsMe">
                            <UserMenuItem text="Режим отображения" @click="toggleTheme">
                                <template #icon>
                                    <AppIcon name="theme" class="flex size-5 text-icon-secondary" />
                                </template>
                            </UserMenuItem>
                            <UserMenuItem text="Выйти" danger @click="logoutHandler">
                                <template #icon>
                                    <AppIcon name="exit" class="flex size-5" />
                                </template>
                            </UserMenuItem>
                        </DropdownMenu>
                    </div>
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
                <h2 class="text-lg font-semibold text-icon-secondary py-2 z-10">
                    Публикации
                </h2>
                <InfiniteFeed :feed-key="`user_${user.id}`" />
            </div>

            <div v-else-if="!isFound" class="min-h-screen flex items-center justify-center text-icon-secondary text-xl">
                <div class="text-center">
                    <p class="text-5xl mb-4">😢</p>
                    <p>Пользователь не найден</p>
                </div>
            </div>
        </ProfileLayout>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { usePostStore } from '~/stores/post';
import type { IUser } from '~/types/user.types';

const userNick: string = useRoute().params.id as string
const authStore = useAuthStore()
const postStore = usePostStore()
const { feeds } = storeToRefs(postStore)

const colorMode = useColorMode()
function toggleTheme() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const { getUserByNickname, openEditProfileModal, logout } = authStore

const logoutHandler = () => logout()
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