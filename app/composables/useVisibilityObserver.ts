import { ref, onMounted, onUnmounted, nextTick, type Ref } from 'vue'

export function useVisibilityObserver(
    sentinelAbove: Ref<HTMLElement | null>,
    sentinelBelow: Ref<HTMLElement | null>
) {
    const isSticky = ref(false)
    const isPostVisible = ref(true)

    let observer: IntersectionObserver | null = null

    const findScrollContainer = (element: HTMLElement | null): HTMLElement | null => {
        let parent = element?.parentElement
        while (parent) {
            const overflow = window.getComputedStyle(parent).overflowY
            if ((overflow === 'auto' || overflow === 'scroll') && parent.scrollHeight > parent.clientHeight) {
                return parent
            }
            parent = parent.parentElement
        }
        return null
    }

    onMounted(() => {
        nextTick(() => {
            if (!sentinelAbove.value || !sentinelBelow.value) return

            const root = findScrollContainer(sentinelAbove.value)

            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.target === sentinelAbove.value) {
                        isPostVisible.value = entry.isIntersecting
                    }
                    if (entry.target === sentinelBelow.value) {
                        isSticky.value = !entry.isIntersecting
                    }
                })
            }, {
                root: root, 
                threshold: 0.1
            })

            observer.observe(sentinelAbove.value)
            observer.observe(sentinelBelow.value)
        })
    })

    onUnmounted(() => {
        observer?.disconnect()
        observer = null
    })

    return {
        isSticky,
        isPostVisible
    }
}