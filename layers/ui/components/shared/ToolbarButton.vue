<template>
    <div :class="toolbarButtonVariants()">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { tv } from 'tailwind-variants'

// Кнопка тулбара. Увеличенный тач-таргет (min-height 40px) — реакции/действия
// легко нажимать пальцем на мобильных. Цвета — из токенов темы, без хардкода.
const toolbarButtonVariants = tv({
    base: 'inline-flex items-center gap-1.5 min-h-10 w-max rounded-full px-3 py-2 cursor-pointer select-none font-semibold text-sm text-icon-secondary transition-colors hover:bg-border-hover hover:text-icon-primary active:bg-surface-accent',
})
</script>
