<template>
    <div class="ml-8 border-b border-l border-border-accent rounded-xl relative">
        <SmartScrollButton 
            :is-visible="isVisible" 
            :scroll-offset="56"
            :class="iconButton({ class: 'sticky top-2 left-0 -translate-x-1/2 z-20' })"
            @click="emit('close')"
        >
            <AppIcon name="cross" class="size-3 flex"/>
        </SmartScrollButton>

        <div @click.stop>
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { iconButton, icon } from '@/utils/ui/atoms'

const isVisible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ close: [] }>()
</script>ф