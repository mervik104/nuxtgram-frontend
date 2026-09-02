<!-- components/AppFooter.vue -->
<template>
    <footer v-if="compact"
        class="mt-auto flex flex-col gap-3 border-t border-border-sidebar pt-4 text-xs text-icon-secondary">
    <a
        href="https://github.com/mervik104/nuxtgram-frontend"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 transition-colors hover:text-icon-primary"
        >
        <AppIcon name="github" class="size-4" />
        GitHub
        </a>

    <a
        href="https://mervik.ru/"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 transition-colors hover:text-icon-primary"
        >
        <img src="/mervik.jpg" alt="" class="size-5 rounded-full object-cover" />
        <span>Сделано <span class="text-icon-primary">MerVik</span></span>
        </a>

        <p>© {{ year }} {{ brand.name }}</p>
    </footer>

    <footer v-else class="mt-10 flex flex-col gap-4 border-t border-border-subtle pt-6 text-xs text-icon-secondary">
        <div class="flex items-center justify-between">
            <NuxtLink :to="navRoutes.feed" class="flex items-center gap-2">
                <img src="/logo.svg" alt="" class="size-6" />
                <span class="text-sm font-medium text-icon-primary">{{ brand.name }}</span>
            </NuxtLink>

            <a href="https://github.com/mervik104/nuxtgram-frontend" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-1.5 transition-colors hover:text-icon-primary">
                <AppIcon name="github" class="size-4" />
                GitHub
            </a>
        </div>

        <div class="flex items-center justify-between">
            <p>© {{ year }} {{ brand.name }}</p>

            <a href="https://mervik.ru/" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-2 transition-colors hover:text-icon-primary">
                <img src="/mervik.jpg" alt="" class="size-5 rounded-full object-cover" />
                <span>Сделано <span class="text-icon-primary">MerVik</span></span>
            </a>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { brand, navRoutes } from '~/data/navigation'

defineProps<{ compact?: boolean }>()

const year = new Date().getFullYear()
</script>