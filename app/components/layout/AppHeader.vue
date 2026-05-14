<template>
  <header class="h-17.5 shrink-0 border-b border-gray-700/50 flex items-center justify-between px-5 bg-surface-base">
    <NuxtLink to="/" class="flex items-center gap-2">
      <img src="/logo.svg" class="w-18.75 h-auto" alt="logo">
      <h1 class="text-2xl font-bold text-white">NuxtGram</h1>
    </NuxtLink>

    <div class="flex items-center gap-2">
      <button :class="button({ variant: 'ghost', rounded: 'full', size: 'md' })" @click="createPostHandler">
        <span class="text-sm">+ Создать</span>
      </button>

      <HeaderAccount />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { usePostStore } from '~/stores/post'
import { button } from '~/utils/ui/atoms'


const postStore = usePostStore()
const { user: me } = storeToRefs(useAuthStore())
const { openCreateModal } = postStore

function createPostHandler() {
  if (me.value) openCreateModal()
  else redirectToLogin()
}
</script>