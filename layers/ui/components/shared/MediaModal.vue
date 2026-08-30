<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="modelValue !== null"
        class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
        @click.self="close"
      >
        <button 
          @click="close"
          class="absolute top-6 right-6 z-10 text-white text-6xl leading-none flex items-center justify-center hover:text-gray-300 transition-colors"
          aria-label="Закрыть"
        >
          <AppIcon name="cross" class="flex size-10"/>
        </button>

        <div 
          ref="modalImageContainer"
          class="relative w-full max-w-6xl h-[85vh] flex items-center justify-center px-4 select-none"
          style="touch-action: none;" 
          @mousedown="startDrag" 
          @mousemove="onDrag" 
          @mouseup="endDrag" 
          @mouseleave="endDrag"
          @touchstart="startDrag" 
          @touchmove.prevent="onDrag" 
          @touchend="endDrag"
          @wheel.prevent="handleWheel"
          @dragstart.prevent
        >
          <div 
            ref="track"
            class="flex h-full"
            :style="trackStyle"
          >
            <div 
              v-for="(img, idx) in images" 
              :key="idx"
              class="w-full h-full shrink-0 flex items-center justify-center overflow-hidden"
            >
              <img 
                :src="buildApiUrl(img.url)" 
                class="max-w-full max-h-full object-contain rounded-2xl pointer-events-none"
                :style="getImageStyle(idx)"
                draggable="false" 
              />
            </div>
          </div>

          <div class="absolute top-6 left-6 bg-black/70 text-white text-sm px-3.5 py-1.5 rounded-full">
            {{ modelValue + 1 }} / {{ images.length }}
          </div>
          
          <div v-if="scale === 1" class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white/60 text-xs px-3 py-1.5 rounded-full pointer-events-none transition-opacity">
            Двойной клик или скролл для зума
          </div>
        </div>

        <div 
          v-if="images.length > 1"
          class="mt-6 flex gap-3 overflow-x-auto pb-6 px-4 py-1 scrollbar-hide snap-x"
        >
          <img 
            v-for="(img, idx) in images" 
            :key="idx" 
            :src="buildApiUrl(img.url)"
            class="w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all snap-start"
            :class="modelValue === idx ? 'border-white scale-105' : 'border-transparent hover:border-white/50'"
            @click="emit('update:modelValue', idx)" 
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MediaArray } from '~/types/common.types'

const props = defineProps<{
  modelValue: number | null
  images: MediaArray
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const { buildApiUrl } = useApiBuilder()

const close = () => emit('update:modelValue', null)

watch(() => props.modelValue, (val) => {
  document.body.style.overflow = val !== null ? 'hidden' : ''
  if (val !== null) resetZoom()
})
onUnmounted(() => {
  document.body.style.overflow = ''
})

const handleKeydown = (e: KeyboardEvent) => {
  if (props.modelValue === null) return
  if (e.key === 'Escape') {
    if (scale.value > 1) resetZoom()
    else close()
  } else if (e.key === 'ArrowLeft' && scale.value === 1) {
    emit('update:modelValue', Math.max(0, props.modelValue - 1))
  } else if (e.key === 'ArrowRight' && scale.value === 1) {
    emit('update:modelValue', Math.min(props.images.length - 1, props.modelValue + 1))
  }
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

const modalImageContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const dragOffsetPercent = ref(0)
const dragThreshold = 10

const getClientX = (e: MouseEvent | TouchEvent) => 'touches' in e ? e.touches[0]!.clientX : e.clientX
const getClientY = (e: MouseEvent | TouchEvent) => 'touches' in e ? e.touches[0]!.clientY : e.clientY

const trackStyle = computed(() => {
  if (props.modelValue === null) return {}
  const baseOffset = -props.modelValue * 100
  const totalOffset = baseOffset - dragOffsetPercent.value
  return {
    transform: `translateX(${totalOffset}%)`,
    transition: isDragging.value ? 'none' : 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)'
  }
})

const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const startPanX = ref(0)
const startPanY = ref(0)
const startClientX = ref(0)
const startClientY = ref(0)

const isPinching = ref(false)
const initialPinchDistance = ref(0)
const initialPinchScale = ref(1)

const resetZoom = () => {
  scale.value = 1
  panX.value = 0
  panY.value = 0
  isPanning.value = false
}

const getImageStyle = (idx: number) => {
  if (idx !== props.modelValue) return {}
  
  return {
    transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
    transformOrigin: 'center center', // Важно для математики зума по курсору
    transition: isPanning.value || isDragging.value || isPinching.value ? 'none' : 'transform 0.3s ease-out',
    cursor: scale.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'zoom-in'
  }
}

const handleWheel = (e: WheelEvent) => {
  if (props.modelValue === null) return
  
  const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15
  const newScale = Math.min(Math.max(1, scale.value * zoomFactor), 8)
  
  if (newScale === 1) {
    resetZoom()
    return
  }

  const rect = modalImageContainer.value?.getBoundingClientRect()
  if (!rect) return

  const mouseX = e.clientX - rect.left - rect.width / 2
  const mouseY = e.clientY - rect.top - rect.height / 2

  const scaleChange = newScale / scale.value
  const newPanX = mouseX - (mouseX - panX.value) * scaleChange
  const newPanY = mouseY - (mouseY - panY.value) * scaleChange

  scale.value = newScale
  panX.value = newPanX
  panY.value = newPanY
}

const handleDblClick = (e: MouseEvent) => {
  if (props.modelValue === null) return
  if (scale.value > 1) {
    resetZoom()
  } else {
    const rect = modalImageContainer.value?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2
    
    const targetScale = 3
    const scaleChange = targetScale / scale.value
    panX.value = mouseX - (mouseX - panX.value) * scaleChange
    panY.value = mouseY - (mouseY - panY.value) * scaleChange
    scale.value = targetScale
  }
}

const getDistance = (e: TouchEvent) => {
  return Math.hypot(
    e.touches[0]!.clientX - e.touches[1]!.clientX,
    e.touches[0]!.clientY - e.touches[1]!.clientY
  )
}

const lastTapTime = ref(0)

const startDrag = (e: MouseEvent | TouchEvent) => {
  if ('button' in e && e.button !== 0) return

  const now = new Date().getTime()
  if (now - lastTapTime.value < 300 && scale.value === 1) {
    handleDblClick(e as any)
    return
  }
  lastTapTime.value = now

  if ('touches' in e && e.touches.length === 2) {
    isPinching.value = true
    initialPinchDistance.value = getDistance(e)
    initialPinchScale.value = scale.value
    return
  }

  if (scale.value > 1) {
    isPanning.value = true
    startPanX.value = panX.value
    startPanY.value = panY.value
    startClientX.value = getClientX(e)
    startClientY.value = getClientY(e)
  } 
  else {
    isDragging.value = true
    startX.value = getClientX(e)
    dragOffsetPercent.value = 0
  }
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (isPinching.value && 'touches' in e && e.touches.length === 2) {
    const currentDistance = getDistance(e)
    const scaleChange = currentDistance / initialPinchDistance.value
    scale.value = Math.min(Math.max(1, initialPinchScale.value * scaleChange), 8)
    if (scale.value === 1) { panX.value = 0; panY.value = 0 }
    return
  }

  if (isPanning.value) {
    const dx = getClientX(e) - startClientX.value
    const dy = getClientY(e) - startClientY.value
    panX.value = startPanX.value + dx
    panY.value = startPanY.value + dy
    return
  }

  if (!isDragging.value || props.modelValue === null) return
  const currentX = getClientX(e)
  const diff = startX.value - currentX
  const width = modalImageContainer.value?.offsetWidth || window.innerWidth
  dragOffsetPercent.value = (diff / width) * 100
}

const endDrag = () => {
  isPinching.value = false
  
  if (isPanning.value) {
    isPanning.value = false
    return
  }

  if (!isDragging.value || props.modelValue === null) return
  isDragging.value = false
  
  let newIndex = props.modelValue
  if (Math.abs(dragOffsetPercent.value) > dragThreshold) {
    if (dragOffsetPercent.value > 0 && props.modelValue < props.images.length - 1) {
      newIndex++
    } else if (dragOffsetPercent.value < 0 && props.modelValue > 0) {
      newIndex--
    }
  }
  
  dragOffsetPercent.value = 0
  if (newIndex !== props.modelValue) {
    emit('update:modelValue', newIndex)
  }
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>