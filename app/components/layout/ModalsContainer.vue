<template>
  <TransitionFade>
    <ProfileSettingsModal v-if="isEditProfileModalOpen" v-model="isEditProfileModalOpen" />
    <PostFormModal v-if="isEditModalOpen && isEditingPost" mode="edit" :post="isEditingPost" v-model:model-value="isEditModalOpen" />
    <PostFormModal v-if="isCreateModalOpen" mode="create" v-model:model-value="isCreateModalOpen" />
  </TransitionFade>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth'
import { usePostStore } from '~/stores/post'
const authStore = useAuthStore()
const postStore = usePostStore()
const { isEditModalOpen, isCreateModalOpen, isEditingPost } = storeToRefs(postStore)
const { isEditProfileModalOpen } = storeToRefs(authStore)

</script>