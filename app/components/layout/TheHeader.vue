<template>
  <header class="h-[70px] shrink-0 border-b border-[#565758] flex items-center justify-between px-5">
    <NuxtLink to="/" class="flex gap-2">
      <img src="/logo.svg" class="w-[75px] h-auto" alt="logo">
      <h1 class="text-2xl my-auto font-bold">NuxtGram</h1>
    </NuxtLink>
    <div class="flex items-center gap-4">
      <HeaderButtonWrapper @click="createPostHandler">
        <p class="text-md">+ Создать</p>
      </HeaderButtonWrapper>
      <HeaderUser />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { usePostStore } from '~/stores/post'

const postStore = usePostStore()
const { user: me } = storeToRefs(useAuthStore())
const { openCreateModal } = postStore

function createPostHandler() {
  if (me.value) openCreateModal()
  else redirectToLogin()
}

</script>