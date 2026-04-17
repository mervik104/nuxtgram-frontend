<template>
    <span :class="[loaderClasses, isCenter ? 'block mx-auto' : '']"></span>
</template>

<script setup lang="ts">
import { loader } from '~/utils/ui/atoms';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
    size?: LoaderSize
    isCenter?: boolean
    theme?: 'heavy' | 'primary' | 'muted' | 'white'
}>(), {
    size: 'md',
    isCenter: false,
    theme: 'primary'
})

const loaderClasses = computed(() => loader({ 
    size: props.size,
    theme: props.theme
}))
</script>