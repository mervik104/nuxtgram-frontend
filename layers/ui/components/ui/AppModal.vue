<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" :class="overlayClasses" @click.self="close">
                <div ref="panelRef"
                    :class="[panelBaseClasses, 'will-change-transform', transitionClass, closing ? 'pointer-events-none' : '']"
                    role="dialog" aria-modal="true" :style="panelStyle" @touchstart.passive="onTouchStart"
                    @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
                    <!-- Ручка свайпа: только у классического нижнего листа (swipe-close="down") -->
                    <div v-if="showHandle" class="sm:hidden pt-1 pb-3 flex justify-center -mt-1">
                        <span class="w-12 h-1.5 rounded-full bg-icon-secondary/40"></span>
                    </div>

                    <button v-if="!hideClose" @click="close"
                        :class="[button({ variant: 'text', size: 'sm' }), 'absolute top-3 right-3 z-20']"
                        aria-label="Закрыть">
                        <AppIcon name="cross" class="size-5" />
                    </button>

                    <slot></slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script lang="ts">
// Модульный (общий для всех инстансов AppModal) стек открытых модалок.
// Нужен для двух вещей:
// 1) кнопка/жест "назад" должна закрывать только САМУЮ ВЕРХНЮЮ модалку, а не все разом;
// 2) блокировка скролла body должна сниматься только когда закрыта последняя модалка.
let modalIdCounter = 0
const openModalIds: number[] = []

function syncBodyScrollLock() {
    if (!import.meta.client) return
    document.documentElement.style.overflow = openModalIds.length > 0 ? 'hidden' : ''
}
</script>

<script setup lang="ts">
import { button, modal } from '~/utils/ui/atoms'

type SwipeClose = 'auto' | 'down' | 'back' | 'none'

const props = withDefaults(defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    padding?: 'default' | 'none'
    // card — центрированная карточка; sheet — нижний лист.
    variant?: 'card' | 'sheet'
    // Скрыть встроенную кнопку-крестик (когда блок использует свою шапку).
    hideClose?: boolean
    // Жест закрытия свайпом:
    //  down — тянем лист вниз (классический bottom sheet);
    //  back — тянем от левого края экрана вправо (системный жест "назад");
    //  none — свайпом не закрывается.
    // auto сам выбирает: full → back, sheet → down, иначе none.
    swipeClose?: SwipeClose
}>(), {
    size: 'md',
    padding: 'default',
    variant: 'sheet',
    hideClose: false,
    swipeClose: 'auto',
})

const isOpen = defineModel<boolean>({ required: true })

const close = () => (isOpen.value = false)

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
})

const isFull = computed(() => props.size === 'full')

const resolvedSwipeClose = computed<'down' | 'back' | 'none'>(() => {
    if (props.swipeClose !== 'auto') return props.swipeClose
    if (isFull.value) return 'back'
    if (props.variant === 'sheet') return 'down'
    return 'none'
})

const showHandle = computed(() => resolvedSwipeClose.value === 'down')
const transitionClass = computed(() => {
    if (isFull.value) return 'page-slide'
    return props.variant === 'sheet' ? 'sheet-slide' : 'card-scale'
})

const overlayClasses = computed(() =>
    modal({ variant: props.variant, padding: props.padding, size: isFull.value ? 'xl' : props.size }).overlay()
)

// size="full" считаем сами, в обход modal() из atoms: на телефоне это честный
// fullscreen без отступов и скруглений, на десктопе — обычная центрированная карточка.
// ⚠️ bg-surface-primary — по аналогии с остальными токенами в проекте (bg-surface-secondary
// и т.п. уже встречаются в PostForm), поправьте класс, если у вас токен называется иначе.
const fullscreenPanelClasses = computed(() => [
    'fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-elevated',
    'h-[100dvh] w-screen',
    'sm:static sm:m-auto sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:shadow-xl',
    props.padding === 'none' ? '' : 'p-4 sm:p-6',
].join(' '))

const panelBaseClasses = computed(() =>
    isFull.value ? fullscreenPanelClasses.value : modal({ variant: props.variant, padding: props.padding, size: props.size }).base()
)

// ---- Свайп для закрытия ----
const isMobile = () => window.matchMedia('(max-width: 639px)').matches
const swipeActive = () => resolvedSwipeClose.value !== 'none' && isMobile()

const panelRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const dragging = ref(false)
const closing = ref(false)

const EDGE_ZONE = 24 // px от левого края экрана, с которого можно начать жест "назад"
const MIN_MOVE_TO_LOCK = 10 // px — минимальное смещение, прежде чем решаем, чей это жест
const CLOSE_THRESHOLD_RATIO = 0.33 // утащили дальше трети размера панели — закрываем
const MIN_DISTANCE_FOR_FLICK = 40 // px — резкий смах короче этого не считается флик-закрытием
const CLOSE_VELOCITY = 0.5 // px/ms, средняя скорость ЗА ВЕСЬ жест (не по последнему кадру — так стабильнее)

let axisLocked: 'x' | 'y' | null = null
let captured = false
let startX = 0
let startY = 0
let startTime = 0
let startScrollTop = 0

// Ближайший вертикально-скроллящийся предок цели касания. Если контент уже
// прокручен (scrollTop > 0), свайп вниз должен скроллить его, а не закрывать лист.
function getActiveScrollTop(target: Element | null): number {
    let el: Element | null = target
    while (el) {
        if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) return el.scrollTop
        el = el.parentElement
    }
    return 0
}

function resetGesture() {
    axisLocked = null
    captured = false
    startTime = 0
}

function onTouchStart(e: TouchEvent) {
    resetGesture()
    dragging.value = false
    closing.value = false
    dragOffset.value = 0

    if (!swipeActive()) return
    const touch = e.touches[0]
    if (!touch) return

    // Жест "назад" ловим только у самого края экрана — иначе он будет мешать обычным тапам
    if (resolvedSwipeClose.value === 'back' && touch.clientX > EDGE_ZONE) return

    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
    startScrollTop = getActiveScrollTop(e.target as Element)
}

function onTouchMove(e: TouchEvent) {
    if (!swipeActive() || startTime === 0) return
    const touch = e.touches[0]
    if (!touch) return

    const dir = resolvedSwipeClose.value
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY

    if (!axisLocked) {
        // Пока смещение меньше порога — не решаем, чей это жест (скролл контента
        // или наше закрытие). Это и убирает "случайные" срабатывания от дрожания пальца.
        if (Math.hypot(dx, dy) < MIN_MOVE_TO_LOCK) return
        axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }

    if (dir === 'down' && (axisLocked !== 'y' || dy <= 0 || startScrollTop > 0)) {
        captured = false
        return
    }
    if (dir === 'back' && (axisLocked !== 'x' || dx <= 0)) {
        captured = false
        return
    }

    captured = true
    dragging.value = true
    if (e.cancelable) e.preventDefault()
    dragOffset.value = dir === 'down' ? dy : dx
}

function onTouchEnd() {
    if (!dragging.value || !captured) {
        resetGesture()
        return
    }

    const dir = resolvedSwipeClose.value
    const elapsed = Math.max(Date.now() - startTime, 1)
    const distance = dragOffset.value
    const avgVelocity = distance / elapsed

    const panelSize = dir === 'down'
        ? (panelRef.value?.offsetHeight ?? window.innerHeight)
        : (panelRef.value?.offsetWidth ?? window.innerWidth)

    const passedThreshold = distance > panelSize * CLOSE_THRESHOLD_RATIO
    const passedFlick = distance > MIN_DISTANCE_FOR_FLICK && avgVelocity > CLOSE_VELOCITY

    dragging.value = false
    resetGesture()

    if (passedThreshold || passedFlick) {
        closing.value = true
        dragOffset.value = panelSize + 40
        setTimeout(() => {
            closing.value = false
            dragOffset.value = 0
            close()
        }, 260)
    } else {
        dragOffset.value = 0
    }
}

const panelStyle = computed(() => {
    if (!dragOffset.value) return undefined
    const dir = resolvedSwipeClose.value
    if (dir === 'down') {
        return {
            transform: `translate3d(0, ${dragOffset.value}px, 0)`,
            transition: dragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }
    }
    const w = panelRef.value?.offsetWidth || window.innerWidth
    return {
        transform: `translate3d(${dragOffset.value}px, 0, 0)`,
        opacity: Math.max(1 - dragOffset.value / (w * 1.3), 0.5),
        transition: dragging.value ? 'none' : 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.26s ease',
    }
})

watch(isOpen, (val) => {
    if (!val) {
        dragging.value = false
        closing.value = false
        dragOffset.value = 0
    }
})

// ---- История браузера: аппаратная/жестовая кнопка "назад" закрывает модалку ----
// Работает без отдельной страницы/роута: при открытии модалки пушим "пустую" запись
// в history (URL не меняется), при закрытии убираем её через history.back(). Если
// юзер нажал системный "назад" — сработает popstate, и мы просто закрываем модалку,
// не трогая историю второй раз (она уже сдвинулась сама).
const modalId = ++modalIdCounter
let hasHistoryEntry = false
let closingFromPopState = false

function pushHistoryEntry() {
    if (!import.meta.client) return
    openModalIds.push(modalId)
    history.pushState({ appModal: true }, '')
    hasHistoryEntry = true
    syncBodyScrollLock()
}

function releaseHistoryEntry() {
    if (!import.meta.client) return
    const idx = openModalIds.indexOf(modalId)
    if (idx !== -1) openModalIds.splice(idx, 1)
    syncBodyScrollLock()
    if (hasHistoryEntry) {
        hasHistoryEntry = false
        history.back()
    }
}

function onPopState() {
    // Реагируем только если наша модалка — самая верхняя из открытых, иначе кнопка
    // "назад" закрыла бы разом все модалки, которые когда-либо открывались на странице.
    if (isOpen.value && openModalIds[openModalIds.length - 1] === modalId) {
        const idx = openModalIds.indexOf(modalId)
        if (idx !== -1) openModalIds.splice(idx, 1)
        syncBodyScrollLock()
        hasHistoryEntry = false
        closingFromPopState = true
        isOpen.value = false
    }
}

watch(isOpen, (val) => {
    if (val) {
        pushHistoryEntry()
    } else if (!closingFromPopState) {
        releaseHistoryEntry()
    }
    closingFromPopState = false
})

onMounted(() => {
    window.addEventListener('popstate', onPopState)
    if (isOpen.value) pushHistoryEntry()
})

onBeforeUnmount(() => {
    window.removeEventListener('popstate', onPopState)
    if (hasHistoryEntry) releaseHistoryEntry()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s ease;
}

.modal-enter-active :deep(.sheet-slide),
.modal-leave-active :deep(.sheet-slide) {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.modal-enter-active :deep(.card-scale),
.modal-leave-active :deep(.card-scale) {
    transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-active :deep(.page-slide),
.modal-leave-active :deep(.page-slide) {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from :deep(.sheet-slide),
.modal-leave-to :deep(.sheet-slide) {
    transform: translate3d(0, 100%, 0);
}

.modal-enter-from :deep(.card-scale),
.modal-leave-to :deep(.card-scale) {
    transform: scale(0.96);
    opacity: 0.5;
}

/* Полноэкранная модалка выезжает/уезжает вбок — как переход между экранами в приложении */
.modal-enter-from :deep(.page-slide),
.modal-leave-to :deep(.page-slide) {
    transform: translate3d(100%, 0, 0);
}
</style>