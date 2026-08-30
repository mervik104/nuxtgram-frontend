<template>
    <AppModal v-model="isOpen" size="sm">
        <div class="flex flex-col items-center text-center gap-4">
            <img :src="brand.logo" class="w-14 h-auto" alt="logo">
            <div>
                <h3 class="text-xl font-bold text-icon-primary">{{ brand.name }}</h3>
                <p class="mt-2 text-sm text-icon-secondary leading-relaxed">
                    Войдите или зарегистрируйтесь, чтобы ставить лайки, комментировать
                    и создавать публикации.
                </p>
            </div>

            <div class="flex flex-col gap-2.5 w-full mt-1">
                <AppButton variant="primary" size="base" rounded="lg" @click="goTo('/login')">
                    Войти
                </AppButton>
                <AppButton variant="secondary" size="base" rounded="lg" @click="goTo('/register')">
                    Зарегистрироваться
                </AppButton>
            </div>
        </div>
    </AppModal>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { brand } from '~/data/navigation'

const authStore = useAuthStore()

const isOpen = computed({
    get: () => authStore.isAuthPromptOpen,
    set: (value) => (value ? authStore.openAuthPrompt() : authStore.closeAuthPrompt()),
})

function goTo(path: string) {
    authStore.closeAuthPrompt()
    navigateTo(path)
}
</script>