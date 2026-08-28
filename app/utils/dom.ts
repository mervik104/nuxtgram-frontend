// Идёт вверх по дереву родителей и возвращает ближайший скролл-контейнер
// элемента (по overflow-y: auto/scroll); если такого нет — окно.
export function findScrollContainer(element: HTMLElement | null): HTMLElement | Window {
    if (!element) return window

    let parent = element.parentElement
    while (parent) {
        const style = window.getComputedStyle(parent)
        const overflowY = style.overflowY
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return parent
        }
        parent = parent.parentElement
    }

    return window
}