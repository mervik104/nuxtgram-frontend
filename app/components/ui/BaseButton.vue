<template>
    <button :type="type" :disabled="isDisabled" :class="[computedClasses, 'gap-2']" v-bind="$attrs">
        <BaseLoader v-if="loading" size="sm" :theme="props.loaderVariant" />
        <slot />
    </button>
</template>

<script setup lang="ts">
import { button } from '~/utils/ui/atoms';
import BaseLoader from './BaseLoader.vue';

defineOptions({ inheritAttrs: false })

type ButtonVariant = 'primary' | 'ghost' | 'text' | 'danger' | 'secondary' | 'success' | 'outline'
type LoaderVariant = 'heavy' | 'primary' | 'muted' | 'white'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'base'
type ButtonRounded = 'full' | 'md' | 'none' | 'xl' | '2xl' | 'sm' | 'lg'

const props = withDefaults(defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    loaderVariant?: LoaderVariant
    rounded?: ButtonRounded
    disabled?: boolean
    error?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
}>(), {
    variant: 'ghost',
    size: 'md',
    rounded: 'lg',
    disabled: false,
    error: false,
    loading: false,
    type: 'button'
})

const isDisabled = computed(() => props.disabled || props.loading)

const computedClasses = computed(() =>
    button({
        variant: props.variant,
        size: props.size,
        rounded: props.rounded,
        disabled: isDisabled.value,
        error: props.error,
        loading: props.loading,
    })
)
</script>