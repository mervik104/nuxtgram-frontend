<template>
    <div :class="['flex flex-col items-center gap-4 text-center', sizeClass.container]">
        <img :src="brand.logo" :width="sizeClass.logo" :height="sizeClass.logo" decoding="async"
            :class="sizeClass.logoClass" alt="">
        <div class="flex flex-col items-center gap-1">
            <h1 :class="['font-semibold text-icon-primary', sizeClass.title]">{{ brand.name }}</h1>
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { brand } from '~/data/navigation'

interface Props {
    // Размер: 'sm' — карточки/мобайл-шапка, 'lg' — бренд-панель входной страницы.
    size?: 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'sm',
})

const sizeClass = computed(() => {
    return props.size === 'lg'
        ? {
            container: 'gap-8',
            logo: 192,
            logoClass: 'lg:w-48 lg:h-48 sm:w-40 sm:h-40 w-36 h-36',
            title: 'text-4xl sm:text-5xl',
        }
        : {
            container: 'gap-2',
            logo: 96,
            logoClass: 'w-20 sm:w-24 sm:h-24 h-20',
            title: 'text-2xl sm:text-3xl',
        }
})
</script>