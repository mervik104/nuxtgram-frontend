<template>
    <div :class="postLayoutVariants().wrapper()">
        <div :class="postLayoutVariants().body()">
            <slot></slot>
        </div>
        <div :class="postLayoutVariants().divider()"></div>
    </div>
</template>

<script setup lang="ts">
import { tv } from 'tailwind-variants'

// Локальный tv()-конфиг карточки поста. Цвета/границы — из токенов темы,
// раскладка и декор (тонкий разделитель снизу) — специфика компонента.
const postLayoutVariants = tv({
    slots: {
        wrapper: 'w-full relative px-3 py-3 sm:p-4 rounded-2xl border-l border-border-input transition-colors',
        body: 'flex flex-col gap-2',
        divider: 'absolute bottom-0 left-3 w-7.75 h-[0.3px] rounded-2xl opacity-20 bg-border-input',
    },
})
</script>
