<template>
    <div :class="[
        'flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors select-none',
        danger
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-gray-200 hover:bg-gray-800'
    ]" @click="$emit('click')">
        <div v-if="$slots.icon" :class="icon({ size: 'md' })">
            <slot name="icon" />
        </div>
        <span class="flex-1 text-sm">{{ text }}</span>
    </div>
</template>

<script setup lang="ts">
import { icon } from '~/utils/ui/atoms';

defineProps<{
    text: string
    danger?: boolean
}>()

defineEmits<{
    (e: 'click'): void
}>()

</script>