<template>
    <button v-if="show" :class="['sticky top-2 z-20 transition-opacity duration-100', $attrs.class]"
        @click="$emit('click')">
        <slot />
    </button>
</template>

<script setup lang="ts">

const props = withDefaults(defineProps<{
    isVisible: boolean
    scrollOffset?: number
    scrollTargetId?: string
}>(), {
    scrollOffset: 0,
    scrollTargetId: 'app-scroller'
})

const emit = defineEmits<{
    click: []
}>()

useAttrs()

const show = ref(false)
const appearScrollY = ref<number | null>(null)
let scrollEl: HTMLElement | null = null

watch(() => props.isVisible, (isVisible) => {
    if (!isVisible) {
        show.value = true
        appearScrollY.value = (scrollEl?.scrollTop ?? 0) + props.scrollOffset
    } else {
        show.value = false
        appearScrollY.value = null
    }
})

const handleScroll = () => {
    if (!show.value || appearScrollY.value === null || !scrollEl) return

    if (scrollEl.scrollTop < appearScrollY.value) {
        show.value = false
        appearScrollY.value = null
    }
}

onMounted(() => {
    scrollEl = document.getElementById(props.scrollTargetId)
    scrollEl?.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
    scrollEl?.removeEventListener('scroll', handleScroll)
})
</script>