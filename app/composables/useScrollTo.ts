const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
    if (!node) return window;

    if (node.scrollHeight > node.clientHeight) {
        const overflowY = window.getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return node;
        }
    }
    return getScrollParent(node.parentElement);
}

export function useScrollTo() {
    const scroll = ({ elementId, offset = 20, notFoundHandler, highlight = true }: {
        elementId: string,
        offset?: number,
        notFoundHandler?: () => void,
        highlight?: boolean
    }) => {
        console.log(highlight)
        const selector = `#${elementId}`
        const element = document.querySelector(selector) as HTMLElement

        if (element) {
            performScroll(element, offset, highlight)
            return
        }

        const observer = new MutationObserver((mutations, obs) => {
            const targetElement = document.querySelector(selector) as HTMLElement
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

        const scrollContainer = getScrollParent(element);

        let scrollTimeout: ReturnType<typeof setTimeout>;
        let hasScrolled = false;

        const onScrollEnd = () => {
            hasScrolled = true;
            clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                triggerHighlight(element);
                scrollContainer.removeEventListener('scroll', onScrollEnd);
            }, 100);
        };

        scrollContainer.addEventListener('scroll', onScrollEnd);

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

    const triggerHighlight = (element: HTMLElement) => {
        element.classList.add('highlighted');

        const onAnimEnd = () => {
            element.classList.remove('highlighted');
            element.removeEventListener('animationend', onAnimEnd);
        };

        element.addEventListener('animationend', onAnimEnd);
    }

    const scrollToPost = (postId: string, options?: { highlight?: boolean }) => {
        scroll({
            elementId: `post-${postId}`,
            highlight: options?.highlight ?? true,
            notFoundHandler: () => redirectToFeed(postId)
        })
    }

    const scrollToComment = (commentId: string, options?: { highlight?: boolean }) => {
        scroll({
            elementId: `comment-${commentId}`,
            highlight: options?.highlight ?? true
        })
    }

    return { scrollToPost, scrollToComment }
}