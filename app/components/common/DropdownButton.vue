<template>
    <!-- need refactor -->
    <button @click="handleClick" class="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-border-hover"
        :class="[
            danger ? 'text-red-400' : 'text-white'
        ]">
        <slot />
    </button>
</template>

<script setup lang="ts">
import { inject } from "vue"

const props = defineProps<{
    danger?: boolean;
}>()

const close = inject<() => void>("menuClose")

const handleClick = (e: MouseEvent) => {
    if (close) close();
}
</script>