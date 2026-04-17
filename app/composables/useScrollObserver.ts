import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export function useScrollObserver(
    sentinelAbove: Ref<HTMLElement | null>,
    sentinelBelow: Ref<HTMLElement | null>
) {
    const isSticky = ref(false);
    const isPostVisible = ref(true);
    const scrollContainer = ref<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;

    const scrollToPostSmooth = () => {
        if (!sentinelAbove.value) return;
        sentinelAbove.value.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const scrollToPostInstant = () => {
        if (!sentinelAbove.value) return;
        sentinelAbove.value.scrollIntoView({
            behavior: 'instant',
            block: 'start'
        });
    };

    const initObserver = () => {
        let parent = sentinelAbove.value?.parentElement;
        while (parent) {
            const overflow = window.getComputedStyle(parent).overflowY;
            if (overflow === 'auto' || overflow === 'scroll') {
                scrollContainer.value = parent;
                break;
            }
            parent = parent.parentElement;
        }

        if (!sentinelBelow.value || !sentinelAbove.value) return;

        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target === sentinelAbove.value) {
                    isPostVisible.value = entry.isIntersecting;
                }
                if (entry.target === sentinelBelow.value) {
                    isSticky.value = !entry.isIntersecting;
                }
            });
        }, {
            root: scrollContainer.value,
            threshold: 0.1
        });

        observer.observe(sentinelBelow.value);
        observer.observe(sentinelAbove.value);
    };

    const destroyObserver = () => {
        if (observer) observer.disconnect();
    };

    return {
        isSticky,
        isPostVisible,
        scrollToPostSmooth,
        scrollToPostInstant,
        initObserver,
        destroyObserver
    };
}