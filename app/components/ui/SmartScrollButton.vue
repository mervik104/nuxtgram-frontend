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
let attachTimer: ReturnType<typeof setTimeout> | null = null

const resolveScrollEl = (): HTMLElement | null => {
    if (!scrollEl) scrollEl = document.getElementById(props.scrollTargetId)
    return scrollEl
}

watch(() => props.isVisible, (isVisible) => {
    if (!isVisible) {
        show.value = true
        appearScrollY.value = (resolveScrollEl()?.scrollTop ?? 0) + props.scrollOffset
    } else {
        show.value = false
        appearScrollY.value = null
    }
}, { immediate: true })

const handleScroll = () => {
    if (!show.value || appearScrollY.value === null) return
    const el = resolveScrollEl()
    if (!el) return

    if (el.scrollTop < appearScrollY.value) {
        show.value = false
        appearScrollY.value = null
    }
}

const attachScroll = () => {
    if (attachTimer) {
        clearTimeout(attachTimer)
        attachTimer = null
    }
    scrollEl?.removeEventListener('scroll', handleScroll)

    const el = resolveScrollEl()
    if (el) {
        el.addEventListener('scroll', handleScroll, { passive: true })
        return
    }
    attachTimer = setTimeout(attachScroll, 100)
}

watch(() => props.scrollTargetId, () => {
    scrollEl = null
    attachScroll()
})

onMounted(attachScroll)

onUnmounted(() => {
    if (attachTimer) clearTimeout(attachTimer)
    scrollEl?.removeEventListener('scroll', handleScroll)
})
</script>