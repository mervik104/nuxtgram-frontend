export default defineNuxtPlugin(() => {
    const router = useRouter()
    const scrollPositions: Record<string, number> = {}
    let isPopState = false
    window.addEventListener('popstate', () => {
        isPopState = true
    })

    router.afterEach((to, from) => {
        nextTick(() => {
            const scroller = document.getElementById('app-scroller')
            if (!scroller) return
            scrollPositions[from.fullPath] = scroller.scrollTop
            if (isPopState) {
                isPopState = false
                const savedPos = scrollPositions[to.fullPath] || 0
                scroller.scrollTo({ top: savedPos, behavior: 'instant' })
            } else {
                if (to.path.startsWith('/profile')) {
                    scroller.scrollTo({ top: 0, behavior: 'instant' })
                } else {
                    scroller.scrollTo({ top: 0, behavior: 'instant' })
                }
            }
        })
    })
})