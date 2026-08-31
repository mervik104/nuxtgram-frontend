<template>
    <div :class="toolbarVariants().toolbar()">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { tv } from 'tailwind-variants'

// Локальный tv()-конфиг тулбара карточки поста. Общие токены темы берутся
// из CSS-переменных (text-icon-*, bg-surface-*), специфика раскладки — здесь.
const toolbarVariants = tv({
    slots: {
        toolbar: 'mt-1 flex flex-wrap items-center gap-1',
    },
})
</script>
