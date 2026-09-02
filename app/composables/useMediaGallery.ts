import type { IMediaItem } from '~/types/common.types'

export function useMediaGallery(items: MaybeRefOrGetter<IMediaItem[]>) {
  const selectedIndex = ref<number | null>(null)
  const media = computed(() => toValue(items) ?? [])

  function open(index: number) {
    if (index >= 0 && index < media.value.length) selectedIndex.value = index
  }

  function close() {
    selectedIndex.value = null
  }

  function select(index: number) {
    if (index >= 0 && index < media.value.length) selectedIndex.value = index
  }

  return { media, selectedIndex, open, close, select }
}
