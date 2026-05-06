<template>
    <NuxtLink :to="to" class="flex content-center select-none gap-4 px-4 py-2 rounded-lg hover:bg-gray-800">
        <div>
            <slot></slot>
        </div>
        <p class="text-sm my-auto">
            {{ content }}
        </p>
    </NuxtLink>
</template>

<script lang="ts" setup>
defineProps<{ to: string, content: string }>()
</script>