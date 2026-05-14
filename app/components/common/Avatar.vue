<template>
  <div :class="[sizeClasses[size], 'relative overflow-hidden rounded-full']">

    <USkeleton
      v-if="isLoading"
      class="absolute inset-0 rounded-full"
    />

    <img
      :src="avatar ? buildAPIUrl(avatar.thumbnailURL) : '/defaultAvatar.png'"
      alt="avatar"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      :draggable="false"
      @load="handleLoad"
    />
  </div>
</template>

<script setup lang="ts">
import type { IAvatarType } from '~/types/UserTypes'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const { buildAPIUrl } = useAPIBuilder()

const props = defineProps<{
  avatar?: IAvatarType
  size: AvatarSize
}>()

const isLoading = ref(true)

const handleLoad = () => {
  isLoading.value = false
}

watch(
  () => props.avatar?.thumbnailURL,
  () => {
    isLoading.value = true
  }
)

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-24 h-24',
  '2xl': 'w-36 h-36',
}
</script>