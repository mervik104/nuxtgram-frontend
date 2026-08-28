import { ref, onMounted, onUnmounted, type Ref } from 'vue';

// Бесконечный скролл по sentinel-элементу:
//  - наблюдает за «сигнальным» элементом в конце списка (или в контейнере,
//    переданном через containerRef);
//  - выставляет isAtBottom, когда sentinel в зоне видимости (с запасом 200px);
//  - предоставляет scrollToTop — вернуть скролл списка/окна наверх.
export function useInfiniteScroll(
    sentinelRef: Ref<HTMLElement | null>,
    containerRef?: Ref<HTMLElement | null>
) {
    const isAtBottom = ref(false);
    let observer: IntersectionObserver | null = null;
    let scrollRoot: HTMLElement | Window | null = null;

    onMounted(() => {
        if (!sentinelRef.value) return;
        // Контейнер прокрутки: переданный явно или ближайший скролл-контейнер.
        scrollRoot = containerRef?.value || findScrollContainer(sentinelRef.value);
        const observerRoot = scrollRoot === window ? null : (scrollRoot as HTMLElement);

        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    isAtBottom.value = true;
                } else {
                    isAtBottom.value = false;
                }
            },
            {
                root: observerRoot,
                rootMargin: '200px',
                threshold: 0 
            }
        );

        observer.observe(sentinelRef.value);
    });

    onUnmounted(() => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    });

    // Прокрутка контейнера (или window) к началу, по умолчанию плавная.
    const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
        if (!scrollRoot) return;
        
        if (scrollRoot === window) {
            window.scrollTo({ top: 0, behavior });
        } else {
            (scrollRoot as HTMLElement).scrollTo({ top: 0, behavior });
        }
    };

    return {
        isAtBottom,
        scrollToTop
    };
}