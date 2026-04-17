<template>
  <div v-if="me" class="flex items-center justify-center pl-1 gap-3 w-full">
    <Avatar :avatar="me.avatar" size="md" class="mb-2"/>
    <div class="relative flex-1 pr-10">
      <div v-if="isEditingComment" class="mb-1">
        <span class="text-sm ml-1 text-gray-200">Изменение комментария</span>
        <button @click="isEditingComment = null" class="text-sm ml-3 text-red-500 hover:underline">Отменить</button>
      </div>

      <textarea ref="textarea" v-model="input" 
        @keydown.enter.exact.prevent="handleSend"

        :placeholder="isEditingComment ? 'Изменение комментария...' : 'Написать комментарий...'"
        class="w-full min-h-10 overflow-hidden border border-[#3A3F45] rounded-xl p-2 pr-12 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors">
    </textarea>

      
      <button v-if="!isSubmitting" @click="handleSend" :disabled="!input.trim()"
        class="absolute right-1 bottom-3 p-1.5 rounded-full transition-all duration-200 group"
        :class="input.trim() && !isEditingComment 
        ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' 
        : input.trim() && isEditingComment 
        ? 'bg-green-500 hover:bg-green-600 cursor-pointer' 
        : 'bg-gray-600 cursor-not-allowed'">
        <ArrowUp class="size-4"/>
      </button>

      <BaseLoader v-else class="absolute right-0 -bottom-2 p-1.5 rounded-full transition-all duration-200 group" :is-center="false" size="sm"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth';
import { useCommentStore } from '~/stores/comment';
import type { IComment } from '~/types/CommentTypes';
const { textarea, input } = useTextareaAutosize()
const oldValue = ref<string>('')
const isEditingComment = defineModel<IComment | null>({ required: true })
const {isSubmitting} = storeToRefs(useCommentStore())

const {user: me} = storeToRefs(useAuthStore())

watch(isEditingComment, () => {
  if (isEditingComment.value) {
    oldValue.value = input.value
    input.value = isEditingComment.value?.content
    textarea.value?.focus()
  }
  if (!isEditingComment.value) {
    input.value = oldValue.value
  }
})

const emit = defineEmits<{
  (e: 'add-comment', input: Ref<string>): void
  (e: 'edit-comment', input: Ref<string>, commentId: string): void
}>()

const handleSend = () => {
  if (isEditingComment.value) {
    editCommentHandler()
  } else {
    emit('add-comment', input)
  }
}

const editCommentHandler = () => {
  if (!isEditingComment.value) return
  emit('edit-comment', input, isEditingComment.value.id)
  isEditingComment.value = null
}

</script>