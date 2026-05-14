<template>
  <article :id="`comment-${props.id}`">
    <CommentWrapper>
      <UserCard :user="author" :date="formatSocialDate(createdAt)" :size="'comment'" />
      <div>
        <TextBody class="pl-1">{{ content }}</TextBody>
        <Toolbar>

          <ToolbarButton @click="likeHandler">
            <LoveIcon class="size-4" :myReaction="!!myReaction" />
            <span>{{ formatCompactNumber(reactionsCount.like) }}</span>
          </ToolbarButton>

          <DropdownMenu v-if="author.id === me?.id">
            <DropdownButton @click="editHandler">Изменить</DropdownButton>
            <DropdownButton @click="deleteHandler" danger>Удалить</DropdownButton>
          </DropdownMenu>

        </Toolbar>
      </div>
    </CommentWrapper>
  </article>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { IComment } from '~/types/CommentTypes';
const me = useAuthStore().user
const props = defineProps<IComment>()
const emit = defineEmits<{
  (e: 'delete-comment', commentId: string): void,
  (e: 'edit-comment'): void,
  (e: 'set-like', comment: IComment): void
}>()

const deleteHandler = () => {
  emit('delete-comment', props.id)
}

const editHandler = () => {
  emit('edit-comment')
}

const likeHandler = () => {
  emit('set-like', props)
}

</script>