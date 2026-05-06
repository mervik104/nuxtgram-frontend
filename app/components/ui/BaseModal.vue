<template>
    <div :class="modal().overlay()" >
        <div :class="modal({ size: 'xl' }).base()" >
            <button @click="isOpen = false"
                :class="[button({ variant: 'text', size: 'sm' }), 'absolute top-4 right-4']">
                <BaseIcon name="cross" class="1"/>
            </button>
            <div>
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { button, modal } from '~/utils/ui/atoms';

const isOpen = defineModel<boolean>({ required: true })

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        isOpen.value = false
    }
})

</script>