<template>
    <div @click="redirectToProfile(props.nickname)" 
    class="px-5 cursor-pointer py-2 hover:brightness-90 text-md select-none flex gap-4 items-center">
        <Avatar :avatar="props.avatar" size="md"/>
        <span class="flex-1 my-auto">
            <slot></slot>
        </span>
    </div>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/UserTypes';
const props = defineProps<IUser>()
</script>


