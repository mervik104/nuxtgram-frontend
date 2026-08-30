<template>
  <TransitionFade>
    <ProfileSettingsModal v-if="isEditProfileModalOpen" v-model="isEditProfileModalOpen" />
    <PostFormModal v-if="isEditModalOpen && isEditingPost" mode="edit" :post="isEditingPost"
      v-model:model-value="isEditModalOpen" />
    <PostFormModal v-if="isCreateModalOpen" mode="create" v-model:model-value="isCreateModalOpen" />
    <AuthPromptModal v-if="isAuthPromptOpen" />
  </TransitionFade>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth'
import { usePostStore } from '~/stores/post'
const authStore = useAuthStore()
const postStore = usePostStore()
const { isEditModalOpen, isCreateModalOpen, isEditingPost } = storeToRefs(postStore)
const { isEditProfileModalOpen, isAuthPromptOpen } = storeToRefs(authStore)

// Гость заходит на сайт — через короткую задержку показываем модалку входа
// (один раз за сессию вкладки, не на страницах авторизации).
const SESSION_KEY = 'nuxtgram-auth-prompt-shown'

onMounted(async () => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return

    const route = useRoute()
    if (route.path === '/login' || route.path === '/register' || route.path === '/sso-callback') {
        sessionStorage.setItem(SESSION_KEY, '1')
        return
    }

    await authStore.getMe()
    if (authStore.user) return

    setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1')
        authStore.openAuthPrompt()
    }, 1200)
})
</script>