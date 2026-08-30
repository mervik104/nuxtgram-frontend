<template>
    <div class="w-full flex flex-col bg-surface-secondary rounded-2xl border border-border-subtle">
        <div class="flex flex-col gap-5 sm:gap-6 p-5 sm:p-8">
            <header class="flex flex-col items-center gap-1.5">
                <h1 class="text-center text-2xl sm:text-3xl font-medium text-icon-primary">{{ title }}</h1>
                <slot name="subtitle" />
            </header>

            <div class="flex flex-col justify-center gap-5 sm:gap-6">
                <slot name="form-fields" />
                <slot name="social" />
                <slot name="buttons" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
interface Props {
    title: string
}

withDefaults(defineProps<Props>(), {})
</script>