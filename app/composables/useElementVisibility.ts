import { onUnmounted } from 'vue'

// Проверка видимости элемента по id (getElementById — корректно работает
// с id, содержащими двоеточия, в отличие от querySelector).
//
// Если элемента ещё нет в DOM — ждём его появления через MutationObserver
// (с таймаутом 3с и ответом false). Наблюдение заканчивается первым ответом.
export function useIsElementVisible() {
    let mutationObserver: MutationObserver | null = null
    let intersectionObserver: IntersectionObserver | null = null

    // Отключает все запущенные наблюдатели (безопасно вызывать повторно).
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

    // Promise<boolean> — видим ли элемент сейчас (порог пересечения 0.1).
    const checkVisibility = (elementId: string): Promise<boolean> => {
        return new Promise((resolve) => {
            cleanup()
            // Запускает IntersectionObserver на конкретном элементе; как только
            // получен первый результат — резолвим и отключаемся.
            const startObserving = (element: HTMLElement) => {
                intersectionObserver = new IntersectionObserver((entries) => {
                    resolve(entries[0]?.isIntersecting || false)
                    cleanup()
                }, { threshold: 0.1 })
                intersectionObserver.observe(element)
            }
            
            const element = document.getElementById(elementId)

            if (element) {
                startObserving(element)
            } else {
                let timeoutId: ReturnType<typeof setTimeout>
                
                // Элемента нет: ждём его появления в DOM (мутации body).
                mutationObserver = new MutationObserver((_, obs) => {
                    const targetElement = document.getElementById(elementId)
                    if (targetElement) {
                        obs.disconnect()
                        mutationObserver = null
                        clearTimeout(timeoutId)
                        startObserving(targetElement)
                    }
                })
                mutationObserver.observe(document.body, { childList: true, subtree: true })
                // Страховка: если за 3 секунды элемент не появился — считаем невидимым.
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