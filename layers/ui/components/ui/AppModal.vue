<template>
    <div :class="modal({ padding }).overlay()" @click.self="isOpen = false">
        <div :class="modal({ size, padding }).base()" role="dialog" aria-modal="true">
            <button @click="isOpen = false"
                :class="[button({ variant: 'text', size: 'sm' }), 'absolute top-3 right-3 z-20']">
                <AppIcon name="cross" class="size-5" />
            </button>
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { button, modal } from '~/utils/ui/atoms';

const props = withDefaults(defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl'
    padding?: 'default' | 'none'
}>(), {
    size: 'md',
    padding: 'default',
})

const isOpen = defineModel<boolean>({ required: true })

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        isOpen.value = false
    }
})

</script>