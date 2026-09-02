<template>
  <div v-if="items.length" class="media-grid" :class="`media-grid--${Math.min(items.length, 4)}`">
    <button
      v-for="(item, index) in items"
      :key="item.id || `${item.url}-${index}`"
      class="media-grid__item"
      type="button"
      :aria-label="`Открыть изображение ${index + 1}`"
      @click="emit('select', index)"
    >
      <span class="media-grid__placeholder" :style="aspectStyle(item)" />
      <img
        class="media-grid__image"
        :src="imageUrl(item.url)"
        :alt="item.alt || ''"
        :loading="index < 2 ? 'eager' : 'lazy'"
        decoding="async"
        draggable="false"
        @load="markLoaded"
      >
    </button>
  </div>
</template>

<script setup lang="ts">
import type { IMediaItem } from '~/types/common.types'

const props = defineProps<{ items: IMediaItem[] }>()
const emit = defineEmits<{ select: [index: number] }>()
const { buildApiUrl } = useApiBuilder()
const loaded = new WeakSet<HTMLImageElement>()

const items = computed(() => props.items ?? [])
const imageUrl = (url: string) => buildApiUrl(url)

function aspectStyle(item: IMediaItem) {
  const ratio = item.width > 0 && item.height > 0 ? item.width / item.height : 1
  return { aspectRatio: String(Math.min(Math.max(ratio, 0.72), 1.5)) }
}

function markLoaded(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  loaded.add(image)
  image.classList.add('media-grid__image--loaded')
}
</script>

<style scoped>
:global(:root) {
  --media-grid-mobile: 768px;
  --media-grid-desktop: 1024px;
  --media-grid-gap: clamp(2px, 0.35vw, 4px);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--media-grid-gap);
  width: 100%;
  overflow: hidden;
  border-radius: clamp(10px, 1.5vw, 18px);
  background: var(--media-skeleton, #e7e8eb);
}

.media-grid__item {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: var(--media-skeleton, #e7e8eb);
  cursor: zoom-in;
}

.media-grid__item:first-child:last-child {
  grid-column: 1 / -1;
}

.media-grid__placeholder,
.media-grid__image {
  display: block;
  width: 100%;
  height: 100%;
}

.media-grid__placeholder { background: var(--media-skeleton, #e7e8eb); }

.media-grid__image {
  position: absolute;
  inset: 0;
  object-fit: cover;
  opacity: 0;
  transition: opacity 180ms ease, transform 220ms ease;
}

.media-grid__image--loaded { opacity: 1; }
.media-grid__item:hover .media-grid__image { transform: scale(1.025); }

@media (min-width: 768px) {
  .media-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .media-grid--1 .media-grid__image { object-fit: contain; }
}

@media (min-width: 1024px) {
  .media-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
