<script setup lang="ts">
import { inject } from "vue";

const props = defineProps<{
    danger?: boolean;
}>();

const close = inject<() => void>("menuClose");

const handleClick = (e: MouseEvent) => {
    if (close) close();
};
</script>

<template>
    <button @click="handleClick" class="w-full text-left px-3 py-1.5 text-sm transition-colors" :class="[
        danger
            ? 'text-red-400 hover:bg-[#2A2F33]'
            : 'text-white hover:bg-[#2A2F33]'
    ]">
        <slot />
    </button>
</template>