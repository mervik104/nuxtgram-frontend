<template>
  <div v-if="user" ref="menuRef" class="relative">
    <div :class="dropdownStyles.trigger()" @click="toggleMenu">
       <UserCard :user="user" :size="'widget'" />
    </div>

    <TransitionFade>
      <UserMenu v-if="isOpen" v-bind="user" @toggle-hidden="toggleMenu" @logout="logoutHandler" />
    </TransitionFade>
  </div>

  <NuxtLink v-else :class="button({ variant: 'ghost', rounded: 'full' })" to="/login">
    Войти
  </NuxtLink>

</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { button, dropdown } from '~/utils/ui/atoms'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const dropdownStyles = dropdown({ align: 'end' })

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function logoutHandler() {
  isOpen.value = false
  authStore.logout()
}

onClickOutside(menuRef, () => (isOpen.value = false))
</script>