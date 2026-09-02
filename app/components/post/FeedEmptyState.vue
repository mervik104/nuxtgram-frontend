<template>
    <div class="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
        <div class="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center">
            <AppIcon name="image" class="size-8 text-icon-secondary" />
        </div>
        <h3 class="text-lg font-semibold text-icon-primary">
            {{ isUserFeed ? 'Пока нет публикаций' : 'Лента пока пуста' }}
        </h3>
        <p class="max-w-xs text-sm text-icon-secondary leading-relaxed">
            {{ isUserFeed
                ? 'Здесь появятся публикации этого пользователя.'
                : 'Здесь появятся публикации пользователей. Возможно, стоит заглянуть позже.' }}
        </p>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    isUserFeed?: boolean
}>(), {
    isUserFeed: false,
})
</script>
