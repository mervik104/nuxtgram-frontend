<template>
    <div class="flex flex-col items-center justify-center gap-4 w-full min-h-full">
        <AppLoader size="md" theme="primary" />
        <p class="text-sm text-icon-secondary">Проверяем данные аккаунта…</p>
        <AuthenticateWithRedirectCallback
            :sign-in-fallback-redirect-url="feedUrl"
            :sign-up-fallback-redirect-url="feedUrl"
        />
    </div>
</template>

<script lang="ts" setup>
import { AuthenticateWithRedirectCallback } from '@clerk/vue'

definePageMeta({
    layout: 'auth',
})

// Куда вести после завершения OAuth-флоу (fallback, если redirectUrlComplete
// из authenticateWithRedirect не прилетел).
const feedUrl = '/feed'
</script>