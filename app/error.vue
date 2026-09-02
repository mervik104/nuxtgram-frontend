<template>
    <div class="min-h-screen bg-surface-background text-icon-primary flex flex-col items-center justify-center text-center px-6 py-16">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-secondary flex items-center justify-center mb-6">
            <AppIcon name="image" class="size-10 sm:size-12 text-icon-secondary" />
        </div>

        <p class="text-6xl sm:text-7xl font-bold text-icon-accent mb-3 select-none">
            {{ error?.statusCode || 404 }}
        </p>

        <h1 class="text-xl sm:text-2xl font-semibold mb-2">
            {{ errorTitle }}
        </h1>

        <p class="max-w-sm text-sm text-icon-secondary leading-relaxed mb-8">
            {{ errorDescription }}
        </p>

        <div class="flex items-center gap-3">
            <AppButton variant="primary" size="base" rounded="lg" @click="goHome">
                На главную
            </AppButton>
            <AppButton variant="secondary" size="base" rounded="lg" @click="goBack">
                Назад
            </AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    error?: {
        statusCode?: number
        statusMessage?: string
        message?: string
    } | null
}>()

const is404 = computed(() => !props.error?.statusCode || props.error.statusCode === 404)

const errorTitle = computed(() =>
    is404.value ? 'Страница не найдена' : 'Что-то пошло не так'
)

const errorDescription = computed(() =>
    is404.value
        ? 'Возможно, страница была удалена или вы перешли по неправильной ссылке.'
        : 'Произошла непредвиденная ошибка. Попробуйте ещё раз или вернитесь на главную.'
)

function goHome() {
    clearError()
    navigateTo('/feed', { replace: true })
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back()
    } else {
        goHome()
    }
}

useHead({
    title: () => (is404.value ? 'Страница не найдена' : 'Ошибка'),
})
</script>
