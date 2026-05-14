<template>
    <NuxtLink :to="`/profile/${nickname}`"
        class="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-gray-800">
        <Avatar :avatar="avatar" size="md" />
        <span class="flex-1 text-md text-gray-200">Профиль</span>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/user.types'
defineProps<IUser>()
</script>