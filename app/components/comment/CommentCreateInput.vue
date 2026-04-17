<template>
  <div v-if="me" class="flex items-center justify-center pl-1 gap-3 w-full">
    <Avatar :avatar="me.avatar" size="md" class="mb-2" />

    <div class="relative flex-1">

      <div v-if="isEditingComment" class="mb-1 flex items-center">
        <span class="text-sm ml-1 text-gray-200">Изменение комментария</span>
        <BaseButton @click="isEditingComment = null" variant="text" size="sm" class="text-red-500 hover:underline ml-3">
          Отменить
        </BaseButton>
      </div>

      <textarea 
        ref="textareaRef" 
        v-model="input" 
        @keydown.enter.exact.prevent="handleSend"
        :placeholder="isEditingComment ? 'Изменение комментария...' : 'Написать комментарий...'"
        :class="[textarea({ 
          overflow: isOverflowing ? 'auto' : 'hidden', 
          resize: 'none',
          fill: 'transparent'
        }), 'max-h-72 !min-h-10']" 
      ></textarea>

      <BaseButton 
    @click="handleSend" 
    :disabled="!input.trim()" 
    :loading="isSubmitting"
    :variant="isEditingComment ? 'success' : 'primary'" 
    loader-variant="white" 
    rounded="full" 
    size="sm"
    class="!p-2 !gap-0 absolute ml-5 bottom-3 group !justify-end" 
>

<span class="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-200 ease-out group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-2 group-hover:pl-2">
        {{ isEditingComment ? 'Сохранить' : 'Отправить' }}
    </span>
    <ArrowUp v-if="!isSubmitting" class="size-4 flex-shrink-0" />
  
    
</BaseButton>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth';
import { useCommentStore } from '~/stores/comment';
import type { IComment } from '~/types/CommentTypes';
import { textarea } from '~/utils/ui/atoms';
import { nextTick, ref, watch } from 'vue';

const { textarea: textareaRef, input } = useTextareaAutosize()
const oldValue = ref<string>('')
const isEditingComment = defineModel<IComment | null>({ required: true })
const { isSubmitting } = storeToRefs(useCommentStore())
const { user: me } = storeToRefs(useAuthStore())

const isOverflowing = ref(false)

watch(input, () => {
  nextTick(() => {
    if (!textareaRef.value) return
    const diff = textareaRef.value.scrollHeight - textareaRef.value.clientHeight
    isOverflowing.value = diff > 2
  })
}, { immediate: true })

watch(isEditingComment, () => {
  if (isEditingComment.value) {
    oldValue.value = input.value
    input.value = isEditingComment.value?.content
    textareaRef.value?.focus()
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
