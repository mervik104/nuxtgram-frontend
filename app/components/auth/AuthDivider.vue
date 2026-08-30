<template>
    <div class="flex items-center gap-4">
        <span class="h-px flex-1 bg-border-subtle"></span>
        <span class="text-sm text-icon-secondary uppercase tracking-wide">{{ label }}</span>
        <span class="h-px flex-1 bg-border-subtle"></span>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ label?: string }>(), {
    label: 'или',
})
</script>