<template>
    <NuxtLink v-if="to" :to="to" :class="link({ active: isActive })" :title="title">
        <div class="shrink-0">
            <slot></slot>
        </div>
        <p class="text-sm my-auto">
            {{ content }}
        </p>
    </NuxtLink>

    <div v-else :class="link({ active: false })" class="opacity-40 pointer-events-none" :title="title">
        <div class="shrink-0">
            <slot></slot>
        </div>
        <p class="text-sm my-auto">
            {{ content }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { tv } from 'tailwind-variants'

const props = defineProps<{ to?: string, content: string, title?: string }>()

const route = useRoute()

const isActive = computed(() => {
    if (!props.to) return false
    if (props.to === '/') return route.path === '/'
    return route.path.startsWith(props.to)
})

const link = tv({
    base: 'flex content-center select-none gap-4 px-4 py-2 rounded-lg transition-colors',
    variants: {
        active: {
            true: 'bg-surface-accent text-icon-primary',
            false: 'hover:bg-surface-accent-hover text-icon-secondary',
        },
    },
    defaultVariants: { active: false },
})
</script>