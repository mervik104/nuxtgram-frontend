<template>
  <div v-if="user" ref="modalRef">
    <UserWidget v-bind="user" @toggle-hidden="isHiddenToggle" />
    <TransitionFade>
      <UserDropdown v-if="!isHidden" @toggle-hidden="isHiddenToggle" v-bind="user" @logout="logoutHandler" />
    </TransitionFade>
  </div>
  <NuxtLink v-else to="/login">
    <HeaderButtonWrapper >
      Войти
    </HeaderButtonWrapper>
  </NuxtLink>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isHidden = ref(true)
const modalRef = ref()

function isHiddenToggle() {
  isHidden.value = !isHidden.value
}

function logoutHandler() {
  isHidden.value = true
  authStore.logout()
}

onClickOutside(modalRef, () => (isHidden.value = true))
</script>