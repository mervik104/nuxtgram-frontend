<template>
    <div class="min-h-[80vh] flex flex-col items-center justify-center text-center gap-4 px-4">
        <span class="grid place-items-center size-16 rounded-full bg-surface-secondary">
            <AppIcon name="message" class="size-8 text-icon-accent" />
        </span>
        <h1 class="text-2xl font-bold text-icon-primary">Мессенджер</h1>
        <p class="text-icon-secondary max-w-xs">Мессенджер в разработке. Скоро здесь появятся диалоги и сообщения.</p>
        <NuxtLink :class="button({ variant: 'primary', size: 'md', rounded: 'md' })" to="/feed">
            Вернуться в ленту
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
import { button } from '~/utils/ui/atoms'

useHead({
    title: 'Мессенджер',
})
</script>
