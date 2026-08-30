<template>
    <div class="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <FeedSinglePost v-if="route.params.id" />
        <InfiniteFeed v-else feed-key="global" />
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>