<template>
    <div class="flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full">
        <Avatar size="sm" :avatar="user.avatar" :alt="user.username" />
        <h3 class="text-md text-center">{{ user.username }}</h3>
    </div>
</template>

<script lang="ts" setup>
import type { IUser } from '~/types/UserTypes';

defineProps<{
  user: IUser
}>()

</script>