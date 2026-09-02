<template>
    <button @click="handleClick"
        :class="[menuItem({ variant: danger ? 'danger' : 'default' }), 'max-sm:px-4 max-sm:py-2.5 max-sm:text-base']">
        <slot />
    </button>
</template>

<script setup lang="ts">
import { inject } from "vue"
import { menuItem } from "~/utils/ui/atoms";

const props = defineProps<{
    danger?: boolean;
}>()

const close = inject<() => void>("menuClose")

const handleClick = (e: MouseEvent) => {
    if (close) close();
}
</script>