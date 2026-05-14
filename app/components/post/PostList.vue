<template>
    <div v-auto-animate>
        <PostCard 
        v-for="post in postsList" 
        :key="post.id" 
        v-bind="post">
        </PostCard>
    </div>
</template>

<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate';

import type { IPost } from '~/types/post.types';
const props = defineProps<{
    postsList: IPost[]
}>()

</script>