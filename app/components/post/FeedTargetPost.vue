<template>
    <div>
        <div v-if="targetPostError" class="p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {{ targetPostError }}
        </div>

        <PostCard 
            v-if="targetPost" 
            :key="'target-' + targetPost.id" 
            v-bind="targetPost" 
            class="mb-8"
        />

        <InfiniteFeed feed-key="global" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { usePostStore } from '~/stores/post'
import { useScrollTo } from '~/composables/useScrollTo'

const route = useRoute()
const postsStore = usePostStore()
const { scrollToPost } = useScrollTo()

const targetPostId = computed(() => route.params.id as string)
const targetPost = computed(() => postsStore.posts[targetPostId.value] || null)
const targetPostError = ref<string | null>(null)

async function resolveTargetPost() {
    targetPostError.value = null
    
    try {
        const post = await postsStore.getPost(targetPostId.value)
        if (!post) {
            targetPostError.value = 'Пост не найден или был удален'
        } else {
            await nextTick()
            setTimeout(() => scrollToPost(targetPostId.value!), 150)
        }
    } catch (error) {
        targetPostError.value = 'Пост не найден или был удален'
    }
}

onMounted(() => {
    resolveTargetPost()
})

</script>