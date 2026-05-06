<template>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <Avatar @click="redirectToProfile(author.nickname)" class="cursor-pointer hover:brightness-90 transition" :avatar="author.avatar" size="md" />
            <span class="text-gray-200 font-medium">
                <div class="flex items-center gap-2">
                    <NuxtLink :to='`/profile/${author.nickname}`' class="text-md cursor-pointer hover:text-gray-300">{{ author.username }}</NuxtLink>
                    <span class=" text-gray-500 text-[12px]"> • {{ date }}</span>
                </div>
                <p class="text-[12px] font-mono text-gray-500">@{{ author.nickname }}</p>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { IUser } from '~/types/UserTypes';
defineProps<{ author: IUser, date: string }>()
</script>