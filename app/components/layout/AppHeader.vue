<template>
  <header class="hidden lg:flex h-16 lg:h-17.5 shrink-0 border-b border-border-header items-center justify-between gap-2 px-4 sm:px-5 bg-surface-base">
    <NuxtLink to="/" class="flex items-center gap-2 min-w-0">
      <img src="/logo.svg" class="w-14 lg:w-12 h-auto shrink-0" alt="logo">
      <h1 class="text-lg lg:text-2xl font-bold text-icon-primary truncate">NuxtGram</h1>
    </NuxtLink>

    <div class="flex items-center gap-2">
      <button :class="button({ variant: 'ghost', rounded: 'full', size: 'md' })" class="hidden sm:inline-flex" @click="createPostHandler">
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

const authStore = useAuthStore()
const postStore = usePostStore()
const { user: me } = storeToRefs(authStore)
const { openCreateModal } = postStore

function createPostHandler() {
  if (me.value) openCreateModal()
  else authStore.openAuthPrompt()
}
</script>