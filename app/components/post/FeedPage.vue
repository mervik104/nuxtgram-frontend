<template>
    <div class="w-full max-w-5xl mx-auto pl-2 sm:px-3 pb-4 sm:p-6">
        <!-- Мобильный Header ленты: логотип по центру + место под поиск -->
        <div v-if="!route.params.id" class="sm:hidden mb-4 flex flex-col items-center gap-3 pt-2">
            <div class="flex items-center gap-2">
                <img :src="brand.logo" class="w-8 h-auto shrink-0" alt="logo">
                <span class="text-lg font-bold text-icon-primary">{{ brand.name }}</span>
            </div>

            <button class="flex w-full items-center gap-2 rounded-full bg-surface-secondary px-4 py-2 text-sm text-icon-secondary">
                <AppIcon name="search" class="size-4 shrink-0" />
                <span>Поиск (пока не работает)</span>
            </button>
        </div>

        <FeedSinglePost v-if="route.params.id" />
        <InfiniteFeed v-else feed-key="global" />

        <AppFooter class="lg:hidden" />
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { brand } from '~/data/navigation'
const route = useRoute()
</script>