// Прокрутка к посту/комментарию с подсветкой после завершения скролла.
//
// Важно: элементы ищутся через getElementById — record-id содержит ':' и
// ломает querySelector (SyntaxError). Если элемента ещё нет в DOM (комментарии
// грузятся асинхронно) — ждём появления через MutationObserver.
export function useScrollTo() {
    // Универсальная прокрутка к элементу по elementId.
    //  - if элемент есть: сразу performScroll;
    //  - если нет: наблюдаем за появлением (до 1с), затем scroll + при
    //    необходимости notFoundHandler (например, редирект на пост).
    const scroll = ({ elementId, offset = 20, notFoundHandler, highlight = true }: {
        elementId: string,
        offset?: number,
        notFoundHandler?: () => void,
        highlight?: boolean
    }) => {
        const element = document.getElementById(elementId)

        if (element) {
            performScroll(element, offset, highlight)
            return
        }

        const observer = new MutationObserver((mutations, obs) => {
            const targetElement = document.getElementById(elementId)
            if (targetElement) {
                performScroll(targetElement, offset, highlight)
                obs.disconnect()
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        setTimeout(() => {
            if (notFoundHandler) {
                notFoundHandler()
            } else {
                observer.disconnect()
            }
        }, 1000)
    }

    // Непосредственно скроллит элемент в начало (scrollIntoView, smooth),
    // выставляет scrollMarginTop под фиксированную шапку и по завершении
    // прокрутки контейнера (или через 50мс «про запас») включает подсветку.
    const performScroll = (element: HTMLElement, offset: number, highlight: boolean) => {
        if (offset > 0) {
            element.style.scrollMarginTop = `${offset}px`
        }

        if (!highlight) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
            return;
        }

        const scrollContainer = findScrollContainer(element);

        let scrollTimeout: ReturnType<typeof setTimeout>;
        let hasScrolled = false;

        // По завершении скролла контейнера (тишина 100мс) — подсветка.
        const onScrollEnd = () => {
            hasScrolled = true;
            clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                triggerHighlight(element);
                scrollContainer.removeEventListener('scroll', onScrollEnd);
            }, 100);
        };

        scrollContainer.addEventListener('scroll', onScrollEnd);

        // Если контейнер не заскроллился за 50мс (уже у края) — подсвечиваем сразу.
        setTimeout(() => {
            if (!hasScrolled) {
                scrollContainer.removeEventListener('scroll', onScrollEnd);
                triggerHighlight(element);
            }
        }, 50)

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })
    }

    // Добавляет класс 'highlighted' (CSS-анимация) и снимает его по
    // окончании анимации (animationend).
    const triggerHighlight = (element: HTMLElement) => {
        element.classList.add('highlighted');

        const onAnimEnd = () => {
            element.classList.remove('highlighted');
            element.removeEventListener('animationend', onAnimEnd);
        };

        element.addEventListener('animationend', onAnimEnd);
    }

    // Скролл к посту (#post-<postId>); если поста нет в ленте — уходим
    // на feed поста через redirectToFeed (стиль поля record-id: "posts:…").
    const scrollToPost = (postId: string, options?: { highlight?: boolean }) => {
        scroll({
            elementId: `post-${postId}`,
            highlight: options?.highlight ?? true,
            notFoundHandler: () => redirectToFeed(postId)
        })
    }

    // Скролл к комментарию (#comment-<commentId>).
    const scrollToComment = (commentId: string, options?: { highlight?: boolean }) => {
        scroll({
            elementId: `comment-${commentId}`,
            highlight: options?.highlight ?? true
        })
    }

    return { scrollToPost, scrollToComment }
}