<template>
    <FeedPage></FeedPage>
</template>

<script setup lang="ts">
    definePageMeta({
        keepalive: true,
    })
    useHead({
        title: 'Лента'
    })    
</script>