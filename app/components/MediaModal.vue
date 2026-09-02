<template>
  <Teleport to="body">
    <Transition name="media-modal">
      <div v-if="open" class="media-modal" :style="backdropStyle" @click.self="close">
        <button class="media-modal__close" type="button" aria-label="Закрыть просмотр" @click="close">×</button>
        <div class="media-modal__counter">{{ index + 1 }} / {{ images.length }}</div>
        <div
          ref="viewport"
          class="media-modal__viewport"
          :class="{ 'is-dragging': dragging }"
          @pointerdown="startPointer"
          @pointermove="movePointer"
          @pointerup="endPointer"
          @pointercancel="endPointer"
          @wheel.prevent="zoomWheel"
          @dblclick="toggleZoom"
        >
          <div class="media-modal__track" :style="trackStyle">
            <div v-for="(item, imageIndex) in images" :key="item.id || imageIndex" class="media-modal__slide">
              <img
                :src="buildApiUrl(item.url)"
                :alt="item.alt || ''"
                draggable="false"
                :style="imageStyle(imageIndex)"
              >
            </div>
          </div>
        </div>
        <div v-if="images.length > 1" class="media-modal__dots" aria-hidden="true">
          <i v-for="(_, dotIndex) in images" :key="dotIndex" :class="{ active: dotIndex === index }" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { IMediaItem } from '~/types/common.types'

const props = defineProps<{ modelValue: number | null; images: IMediaItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const { buildApiUrl } = useApiBuilder()
const viewport = ref<HTMLElement | null>(null)
const scale = ref(1)
const pan = reactive({ x: 0, y: 0 })
const dragging = ref(false)
const pointer = reactive({ id: -1, x: 0, y: 0, startX: 0, startY: 0, moved: false })
const dragX = ref(0)
const dragY = ref(0)
const activePointers = new Map<number, { x: number; y: number }>()
const pinchStartDistance = ref(0)
const pinchStartScale = ref(1)

const open = computed(() => props.modelValue !== null)
const index = computed(() => props.modelValue ?? 0)

const trackStyle = computed(() => ({
  transform: `translate3d(calc(${-index.value * 100}% + ${dragX.value}px), ${dragY.value}px, 0)`,
  transition: dragging.value ? 'none' : 'transform 280ms cubic-bezier(.22,.8,.25,1)',
}))
const backdropStyle = computed(() => ({ opacity: String(Math.max(0.35, 1 - Math.abs(dragY.value) / 520)) }))

function imageStyle(imageIndex: number) {
  if (imageIndex !== index.value) return {}
  return { transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale.value})` }
}
function resetZoom() { scale.value = 1; pan.x = 0; pan.y = 0 }
function close() { emit('update:modelValue', null) }
function change(delta: number) {
  const next = index.value + delta
  if (next >= 0 && next < props.images.length) { resetZoom(); emit('update:modelValue', next) }
}
function zoom(value: number) { scale.value = Math.min(4, Math.max(1, value)); if (scale.value === 1) resetZoom() }
function zoomWheel(event: WheelEvent) { zoom(scale.value * (event.deltaY < 0 ? 1.15 : 0.87)) }
function toggleZoom() { zoom(scale.value > 1 ? 1 : 2.5) }
function distance(touches: TouchList) { return Math.hypot(touches[0]!.clientX - touches[1]!.clientX, touches[0]!.clientY - touches[1]!.clientY) }

function startPointer(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  viewport.value?.setPointerCapture(event.pointerId)
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (activePointers.size === 2) {
    const [first, second] = [...activePointers.values()]
    pinchStartDistance.value = Math.hypot(first!.x - second!.x, first!.y - second!.y)
    pinchStartScale.value = scale.value
    dragging.value = false
    return
  }
  pointer.id = event.pointerId; pointer.x = pointer.startX = event.clientX; pointer.y = pointer.startY = event.clientY; pointer.moved = false
  dragging.value = true
}
function movePointer(event: PointerEvent) {
  const active = activePointers.get(event.pointerId)
  if (active) { active.x = event.clientX; active.y = event.clientY }
  if (activePointers.size === 2) {
    const [first, second] = [...activePointers.values()]
    const currentDistance = Math.hypot(first!.x - second!.x, first!.y - second!.y)
    zoom(pinchStartScale.value * currentDistance / pinchStartDistance.value)
    return
  }
  if (!dragging.value || event.pointerId !== pointer.id) return
  const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y
  pointer.moved ||= Math.abs(event.clientX - pointer.startX) > 5 || Math.abs(event.clientY - pointer.startY) > 5
  if (scale.value > 1) { pan.x += dx; pan.y += dy } else { dragX.value = event.clientX - pointer.startX; dragY.value = event.clientY - pointer.startY }
  pointer.x = event.clientX; pointer.y = event.clientY
}
function endPointer(event: PointerEvent) {
  activePointers.delete(event.pointerId)
  if (activePointers.size) { dragging.value = false; return }
  if (!dragging.value) return
  dragging.value = false
  if (scale.value > 1) { dragX.value = 0; dragY.value = 0; return }
  const x = dragX.value; const y = dragY.value; dragX.value = 0; dragY.value = 0
  if (Math.abs(y) > 120) close(); else if (Math.abs(x) > 70) change(x < 0 ? 1 : -1)
}
function onKey(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') close(); else if (event.key === 'ArrowLeft') change(-1); else if (event.key === 'ArrowRight') change(1)
}

watch(() => props.modelValue, (value) => { if (value !== null) resetZoom() })
watch(open, (value) => { if (import.meta.client) document.body.style.overflow = value ? 'hidden' : '' })
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<style scoped>
:global(:root) { --media-modal-mobile: 768px; --media-modal-desktop: 1024px; }
.media-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgb(8 10 14 / 96%); backdrop-filter: blur(18px); transition: opacity 180ms ease; touch-action: none; }
.media-modal__viewport { width: min(1200px, 100vw); height: 100dvh; overflow: hidden; touch-action: none; user-select: none; }
.media-modal__viewport.is-dragging { cursor: grabbing; }
.media-modal__track { display: flex; width: 100%; height: 100%; will-change: transform; }
.media-modal__slide { display: flex; flex: 0 0 100%; align-items: center; justify-content: center; width: 100%; height: 100%; padding: clamp(16px, 5vw, 72px); }
.media-modal__slide img { max-width: 100%; max-height: 100%; object-fit: contain; pointer-events: none; transition: transform 180ms ease; will-change: transform; }
.media-modal__close { position: absolute; z-index: 2; top: max(16px, env(safe-area-inset-top)); right: max(16px, env(safe-area-inset-right)); width: 44px; height: 44px; border: 0; border-radius: 50%; color: white; background: rgb(0 0 0 / 45%); font-size: 34px; line-height: 1; cursor: pointer; }
.media-modal__counter { position: absolute; z-index: 2; top: max(22px, env(safe-area-inset-top)); left: 20px; color: rgb(255 255 255 / 85%); font: 600 14px/1 system-ui, sans-serif; }
.media-modal__dots { position: absolute; bottom: max(22px, env(safe-area-inset-bottom)); display: flex; gap: 6px; }
.media-modal__dots i { width: 6px; height: 6px; border-radius: 50%; background: rgb(255 255 255 / 35%); }.media-modal__dots i.active { background: white; transform: scale(1.25); }
.media-modal-enter-from, .media-modal-leave-to { opacity: 0; }
@media (min-width: 1024px) { .media-modal__viewport { height: min(92dvh, 900px); border-radius: 12px; } .media-modal__slide { padding: 32px 76px; } }
</style>
