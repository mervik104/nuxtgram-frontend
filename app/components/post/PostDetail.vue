<template>
    <div class="mx-auto px-20">
        <div v-if="post">
            <div class="p-4  rounded-3xl mb-4">
                <NuxtLink :to="{ name: 'feed' }">
                    <p class="mb-10 text-gray-400 hover:text-gray-500"> <- Назад</p>
                </NuxtLink>
                <PostCard v-bind="post"></PostCard>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { usePostStore } from '~/stores/post';
import type { IPost } from '~/types/PostTypes';

const id: string = useRoute().params.id as string
const post = ref<IPost>()

const { getPost } = usePostStore()
post.value = await getPost(id)

</script>