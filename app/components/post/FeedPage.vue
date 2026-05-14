<template>
    <div class="mx-auto w-275 p-4">
        <FeedTargetPost v-if="route.params.id" />
        <InfiniteFeed v-else feed-key="global" />
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>