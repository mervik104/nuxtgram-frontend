<template>
    <button
        class="inline-flex items-center justify-center size-9 rounded-full transition-colors text-icon-secondary hover:text-icon-primary hover:bg-surface-secondary outline-none focus-visible:ring-2 focus-visible:ring-icon-accent"
        title="Переключить тему" @click="toggleTheme">
        <AppIcon name="theme" class="size-5" />
    </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

function toggleTheme() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
