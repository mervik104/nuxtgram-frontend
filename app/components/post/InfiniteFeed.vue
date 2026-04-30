<template>
    <div>
        <PostList v-if="filteredPosts.length > 0" :posts-list="filteredPosts" />
        <div ref="bottomSentinel" class="h-1 w-full"></div>
        <div v-if="!canLoadMore && posts.length > 0" class="text-center py-4 text-gray-500">
            Вы достигли конца
        </div>
        <div class="flex items-center justify-center">
            <TransitionDrop>
                <BaseLoader v-if="isLoading && (posts.length > 0 || posts.length === 0)" :is-center="true" theme="muted"
                    size="lg" />
            </TransitionDrop>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePostStore } from '~/stores/post'

const props = withDefaults(defineProps<{
    feedKey: string
    excludeIds?: string[]
}>(), {
    excludeIds: () => []
})

const postsStore = usePostStore()
const bottomSentinel = ref<HTMLElement | null>(null)
const { isAtBottom } = useInfiniteScroll(bottomSentinel)
const posts = computed(() => postsStore.getFeedList(props.feedKey))
const filteredPosts = computed(() => {
    if (props.excludeIds.length === 0) return posts.value
    return posts.value.filter(post => !props.excludeIds.includes(post.id))
})
const isLoading = computed(() => postsStore.feeds[props.feedKey]?.isLoading || false)
const canLoadMore = computed(() => {
    const feed = postsStore.feeds[props.feedKey]
    if (!feed) return true
    return !feed.isFullyLoaded
})

function fetchCurrentFeed(page: number) {
    if (props.feedKey === 'global') return postsStore.getGlobalFeed(page)
    if (props.feedKey.startsWith('user_')) {
        const userId = props.feedKey.replace('user_', '')
        return postsStore.getUserFeed(userId, page)
    }
}

onMounted(() => {
    if (posts.value.length === 0) {
        fetchCurrentFeed(1)
    }
})

watch(isAtBottom, (atBottom) => {
    if (atBottom && canLoadMore.value && !isLoading.value) {
        const feed = postsStore.feeds[props.feedKey]
        if (!feed?.meta) return
        const currentPage = feed.meta.page || 1
        fetchCurrentFeed(currentPage + 1)
    }
})
</script>