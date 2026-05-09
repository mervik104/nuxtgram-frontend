<template>
    <div v-if="images.length > 0" class="relative w-full rounded-2xl overflow-hidden bg-neutral-950 group">

        <img :src="buildAPIUrl(images[currentPreviewIndex]?.url ?? '')"
            class="w-full max-h-[70vh] object-contain cursor-zoom-in select-none"
            @click="openModal(currentPreviewIndex)" draggable="false" />

        <button v-if="images.length > 1" @click.stop="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-11 h-11 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="Предыдущее изображение">
            <BaseIcon name="left"/>
        </button>

        <button v-if="images.length > 1" @click.stop="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-11 h-11 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="Следующее изображение">
            <BaseIcon name="right"/>
        </button>

        <div v-if="images.length > 1"
            class="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full font-medium">
            {{ currentPreviewIndex + 1 }} / {{ images.length }}
        </div>

        <MediaModal v-model="selectedIndex" :images="images" />
    </div>
</template>

<script setup lang="ts">
import type { MediaArray } from '~/types/CommonTypes'

const props = defineProps<{ images: MediaArray }>()
const { buildAPIUrl } = useAPIBuilder()
const images = computed(() => props.images || [])

const currentPreviewIndex = ref<number>(0)

const prevImage = () => currentPreviewIndex.value = Math.max(0, currentPreviewIndex.value - 1)
const nextImage = () => currentPreviewIndex.value = Math.min(images.value.length - 1, currentPreviewIndex.value + 1)

const selectedIndex = ref<number | null>(null)

const openModal = (index: number) => {
    selectedIndex.value = index
}

</script>