<template>
    <div v-if="images.length > 0" class="relative w-full rounded-2xl overflow-hidden bg-surface-secondary group"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">

        <USkeleton v-if="isImageLoading" class="absolute inset-0" />

        <img :src="buildApiUrl(images[currentPreviewIndex]?.url ?? '')"
            class="w-full max-h-[70vh] object-contain cursor-zoom-in select-none transition-opacity duration-300"
            :class="[isImageLoading ? 'opacity-0' : 'opacity-100', dragging ? draggingClass : '']"
            :style="draggingStyle" @load="handleImageLoad" @click="openModal(currentPreviewIndex)" draggable="false" />

        <!-- Кнопки листания — только на десктопе (sm+), появляются по hover.
             На мобильных листаем свайпом по изображению, чтобы не загораживать картинку. -->
        <button v-if="images.length > 1" @click.stop="prevImage"
            class="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 bg-surface-menu/80 hover:bg-surface-menu text-icon-primary
            w-11 h-11 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100
            active:scale-90 shadow-lg"
            aria-label="Предыдущее изображение">
            <AppIcon name="left" class="size-5" />
        </button>

        <button v-if="images.length > 1" @click.stop="nextImage"
            class="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 bg-surface-menu/80 hover:bg-surface-menu text-icon-primary
            w-11 h-11 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100
            active:scale-90 shadow-lg"
            aria-label="Следующее изображение">
            <AppIcon name="right" class="size-5" />
        </button>

        <div v-if="images.length > 1"
            class="absolute bottom-4 right-4 bg-surface-menu/80 text-icon-primary text-sm px-3 py-1 rounded-full font-medium shadow">
            {{ currentPreviewIndex + 1 }} / {{ images.length }}
        </div>

        <MediaModal v-model="selectedIndex" :images="images" />
    </div>
</template>

<script setup lang="ts">
import type { MediaArray } from '~/types/common.types'

const props = defineProps<{ images: MediaArray }>()

const { buildApiUrl } = useApiBuilder()

const images = computed(() => props.images || [])

const currentPreviewIndex = ref(0)
const selectedIndex = ref<number | null>(null)

const isImageLoading = ref(true)

const handleImageLoad = () => {
    isImageLoading.value = false
}

watch(currentPreviewIndex, () => {
    isImageLoading.value = true
})

const prevImage = () => {
    currentPreviewIndex.value = Math.max(0, currentPreviewIndex.value - 1)
}

const nextImage = () => {
    currentPreviewIndex.value = Math.min(
        images.value.length - 1,
        currentPreviewIndex.value + 1
    )
}

const openModal = (index: number) => {
    selectedIndex.value = index
}

// Свайп по изображению: листание вперёд/назад на тач-устройствах, где
// hover-кнопки недоступны. Если свайп был коротким/почти без смещения —
// не мешаем клику (открытию модалки). Движение картинки за пальцем
// показываем лёгким сдвигом по горизонтали.
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let tracking = false

const SWIPE_DISTANCE = 60 // порог срабатывания листания, px
const SWIPE_VELOCITY = 0.5 // либо достаточно быстрый смах, px/ms

const dragX = ref(0)
const dragging = ref(false)

const draggingClass = computed(() => (dragging.value ? 'transition-none' : 'transition-opacity duration-300'))
const draggingStyle = computed(() => {
    if (!dragX.value) return undefined
    return {
        transform: `translateX(${dragX.value}px)`,
        opacity: Math.max(1 - Math.abs(dragX.value) / 480, 0.4),
        transition: dragging.value ? 'none' : 'transform 0.25s ease, opacity 0.25s ease',
    }
})

function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    tracking = true
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()
    dragX.value = 0
    dragging.value = true
}

function onTouchMove(e: TouchEvent) {
    if (!tracking) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY
    // Жест больше вертикальный — вероятно, скролл ленты, отпускаем.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        tracking = false
        dragging.value = false
        dragX.value = 0
        return
    }
    if (Math.abs(dx) > 8) {
        e.preventDefault()
    }
    dragX.value = dx
}

function onTouchEnd() {
    if (!tracking) return
    tracking = false
    const dx = dragX.value
    const elapsed = Date.now() - touchStartTime
    const velocity = Math.abs(dx) / Math.max(elapsed, 1)
    const thresholdLeft = dx > SWIPE_DISTANCE || (dx > 0 && velocity > SWIPE_VELOCITY)
    const thresholdRight = dx < -SWIPE_DISTANCE || (dx < 0 && velocity > SWIPE_VELOCITY)

    if (thresholdRight) nextImage()
    else if (thresholdLeft) prevImage()

    dragging.value = false
    dragX.value = 0
}
</script>
