<template>
  <!-- Мобильный вариант: без аватара, инпут сдвинут влево, кнопка отправки справа от инпута -->
  <div v-if="me && mobile" class="flex w-full items-end gap-2">

    <div class="flex-1">
      <div v-if="isEditingComment" class="mb-1 flex items-center">
        <span class="text-sm ml-1 text-gray-200">Изменение комментария</span>
        <AppButton @click="isEditingComment = null" variant="text" size="sm" class="text-red-500 hover:underline ml-3">
          Отменить
        </AppButton>
      </div>

      <textarea ref="textareaRef" v-model="input" @keydown.enter.exact.prevent="handleSend"
        :placeholder="isEditingComment ? 'Изменение комментария...' : 'Написать комментарий...'" :class="[textarea({
          overflow: isOverflowing ? 'auto' : 'hidden',
          resize: 'none',
          fill: 'transparent'
        }), 'max-h-72 min-h-10!']"></textarea>
    </div>

    <AppButton @click="handleSend" :disabled="!input.trim()" :loading="isSubmitting"
      :variant="isEditingComment ? 'success' : 'primary'" loader-variant="white" rounded="full" size="sm"
      class="shrink-0 self-end mb-2 gap-1 p-2!">
      <span class="hidden sm:inline whitespace-nowrap">{{ isEditingComment ? 'Сохранить' : 'Отправить' }}</span>
      <AppIcon v-if="!isSubmitting" name="arrowUp" class="size-6 shrink-0" />
    </AppButton>

  </div>

  <!-- Десктоп: исходный вид (без изменений) -->
  <div v-else-if="me && !mobile" class="flex items-center justify-center pl-1 gap-3 w-full">
    <Avatar @click="redirectToProfile(me.nickname)" class="cursor-pointer hover:brightness-90 mb-2 transition" :avatar="me.avatar" size="md" />

    <div class="relative flex-1">

      <div v-if="isEditingComment" class="mb-1 flex items-center">
        <span class="text-sm ml-1 text-gray-200">Изменение комментария</span>
        <AppButton @click="isEditingComment = null" variant="text" size="sm" class="text-red-500 hover:underline ml-3">
          Отменить
        </AppButton>
      </div>

      <textarea ref="textareaRef" v-model="input" @keydown.enter.exact.prevent="handleSend"
        :placeholder="isEditingComment ? 'Изменение комментария...' : 'Написать комментарий...'" :class="[textarea({
          overflow: isOverflowing ? 'auto' : 'hidden',
          resize: 'none',
          fill: 'transparent'
        }), 'max-h-72 min-h-10!']"></textarea>

      <AppButton @click="handleSend" :disabled="!input.trim()" :loading="isSubmitting"
        :variant="isEditingComment ? 'success' : 'primary'" loader-variant="white" rounded="full" size="sm"
        class="p-2! gap-0! absolute ml-5 bottom-3 group justify-end!">

        <AppIcon v-if="!isSubmitting" name="arrowUp" class="size-6 shrink-0" />

      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth';
import { useCommentStore } from '~/stores/comment';
import type { IComment } from '~/types/comment.types.ts';
import { textarea } from '~/utils/ui/atoms';
import { nextTick, ref, watch } from 'vue';

const { textarea: textareaRef, input } = useTextareaAutosize()
const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
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
