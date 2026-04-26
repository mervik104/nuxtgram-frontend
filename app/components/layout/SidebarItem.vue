<template>
    <NuxtLink :to="to" class="flex content-center select-none gap-4 px-4 py-2 rounded-lg hover:bg-gray-800">
        <div class="w-6 h-6"><img src="/favicon.svg" alt=""></div>
        <p class="text-sm my-auto">
            <slot></slot>
        </p>
    </NuxtLink>
</template>

<script lang="ts" setup>
defineProps<{ to: string }>()
</script>