<template>
  <header
    class="hidden lg:flex h-16 lg:h-17.5 shrink-0 border-b border-border-header items-center justify-between gap-2 px-4 sm:px-5 bg-surface-base">
    <NuxtLink to="/" class="flex items-center gap-2 min-w-0 shrink-0">
      <img src="/logo.svg" class="w-14 lg:w-12 h-auto shrink-0" alt="logo">
      <h1 class="text-lg lg:text-2xl font-bold text-icon-primary truncate">NuxtGram</h1>
    </NuxtLink>

    <!-- Поиск -->
    <div class="flex-1 flex justify-center px-4">
      <label class="group flex items-center gap-2 w-full max-w-xl h-10 rounded-full px-4
               bg-surface-secondary border border-transparent
               focus-within:bg-surface-base focus-within:border-border-header
               transition-colors cursor-text">
        <AppIcon name="search" class="w-4 h-4 shrink-0 text-icon-secondary group-focus-within:text-icon-primary" />

        <input v-model="search" type="text" name="q" autocomplete="off" placeholder="Поиск в NuxtGram (пока не работает)"
          class="w-full bg-transparent outline-none text-sm text-icon-primary placeholder:text-icon-secondary"
          @keyup.enter="submitSearch">

        <button v-if="search" type="button" class="shrink-0 text-icon-secondary hover:text-icon-primary"
          @click="clearSearch">
          <AppIcon name="cross" class="w-4 h-4" />
        </button>
      </label>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <ThemeToggle />
      <NotificationBell />

      <button class="hidden sm:inline-flex items-center justify-center transition-colors font-medium rounded-full px-4 py-2 text-base gap-2 text-icon-primary hover:bg-surface-secondary outline-none focus-visible:ring-2 focus-visible:ring-icon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        @click="createPostHandler">
        <span class="text-sm">+ Создать</span>
      </button>

      <HeaderAccount />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { usePostStore } from '~/stores/post'

const authStore = useAuthStore()
const postStore = usePostStore()
const { user: me } = storeToRefs(authStore)
const { openCreateModal } = postStore

const search = ref('')

function submitSearch() {
  if (!search.value.trim()) return
  navigateTo({ path: '/search', query: { q: search.value } })
}

function clearSearch() {
  search.value = ''
}

function createPostHandler() {
  if (me.value) openCreateModal()
  else authStore.openAuthPrompt()
}
</script>
