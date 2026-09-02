<template>
    <div class="flex justify-center flex-col items-stretch gap-2.5">
        <button
            v-for="provider in providers"
            :key="provider.strategy"
            type="button"
            :disabled="isBusy"
            :aria-label="provider.label"
            :class="button({ variant: 'secondary', size: 'lg', rounded: 'full', disabled: isBusy })"
            class="size-auto h-12 w-full rounded-md"
            @click="start(provider.strategy)"
        >
            <AppLoader v-if="loading === provider.strategy" size="sm" theme="muted" />
            <template v-else>
                <AppIcon :name="provider.icon" class="size-5 shrink-0" />
                <span class="inline">{{ provider.label }}</span>
            </template>
        </button>
    </div>
</template>

<script lang="ts" setup>
import { socialProviders, type OAuthStrategy } from '~/data/socialOAuth'
import { button } from '~/utils/ui/atoms'

const props = withDefaults(defineProps<{
    // Какая сторона флоу запускается: вход или регистрация.
    mode?: 'sign-in' | 'sign-up'
    providers?: typeof socialProviders
}>(), {
    mode: 'sign-in',
    providers: () => socialProviders,
})

const { startSignInWithProvider, startSignUpWithProvider } = useOAuth()
const loading = ref<OAuthStrategy | null>(null)
const isBusy = computed(() => loading.value !== null)

const start = async (strategy: OAuthStrategy) => {
    if (isBusy.value) return
    loading.value = strategy
    try {
        if (props.mode === 'sign-up') {
            await startSignUpWithProvider(strategy)
        } else {
            await startSignInWithProvider(strategy)
        }
        // Успех — уходим на страницу OAuth; UI здесь завершается.
    } catch (error) {
        const toast = useToast()
        toast.add({
            color: 'error',
            icon: 'solar:danger-triangle-bold',
            title: 'Не удалось войти',
            description: error instanceof Error ? error.message : 'Попробуйте ещё раз.',
            duration: 3500,
        })
    } finally {
        loading.value = null
    }
}
</script>