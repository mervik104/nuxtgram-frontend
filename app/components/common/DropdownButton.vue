<template>
    <button @click="handleClick" :class="dropdownButton({ variant: danger ? 'danger' : 'default' })">
        <slot />
    </button>
</template>

<script setup lang="ts">
import { inject } from "vue"
import { dropdownButton } from "~/utils/ui/atoms";

const props = defineProps<{
    danger?: boolean;
}>()

const close = inject<() => void>("menuClose")

const handleClick = (e: MouseEvent) => {
    if (close) close();
}
</script>