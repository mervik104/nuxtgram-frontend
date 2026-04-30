import { onUnmounted } from 'vue'

export function useIsElementVisible() {
    let mutationObserver: MutationObserver | null = null
    let intersectionObserver: IntersectionObserver | null = null

    const cleanup = () => {
        if (mutationObserver) {
            mutationObserver.disconnect()
            mutationObserver = null
        }
        if (intersectionObserver) {
            intersectionObserver.disconnect()
            intersectionObserver = null
        }
    }

    const checkVisibility = (elementId: string): Promise<boolean> => {
        return new Promise((resolve) => {
            cleanup()
            const startObserving = (element: HTMLElement) => {
                intersectionObserver = new IntersectionObserver((entries) => {
                    resolve(entries[0]?.isIntersecting || false)
                    cleanup()
                }, { threshold: 0.1 })
                intersectionObserver.observe(element)
            }
            
            const selector = `#${elementId}`
            const element = document.querySelector(selector) as HTMLElement

            if (element) {
                startObserving(element)
            } else {
                let timeoutId: ReturnType<typeof setTimeout>
                
                mutationObserver = new MutationObserver((_, obs) => {
                    const targetElement = document.querySelector(selector) as HTMLElement
                    if (targetElement) {
                        obs.disconnect()
                        mutationObserver = null
                        clearTimeout(timeoutId)
                        startObserving(targetElement)
                    }
                })
                mutationObserver.observe(document.body, { childList: true, subtree: true })
                timeoutId = setTimeout(() => {
                    cleanup()
                    resolve(false)
                }, 3000)
            }
        })
    }

    onUnmounted(() => {
        cleanup()
    })

    return { checkVisibility }
}