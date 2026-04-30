<template>
  <article class="mb-4" :id="`post-${props.id}`">
    <post-wrapper>
      <PostHeader :date="formatSocialDate(createdAt)" :author="author" />
      <div class="relative">
        <TextBody class="pl-2">{{ content }}</TextBody>
        <Toolbar>

          <ToolbarButton @click="likeHandler">
            <img :src="myReaction ? '/redLike.svg' : '/like.svg'" />
            <span>{{ formatCompactNumber(reactionsCount.like) }}</span>
          </ToolbarButton>

          <ToolbarButton @click="isCommentsOpen = !isCommentsOpen">
            <img draggable="false" src="/comment.svg" alt="comment">
            <span>{{ commentsCount }}</span>
          </ToolbarButton>

          <ToolbarButton @click="() => createPostUrl(props.id)">
            <ShareIcon/>
          </ToolbarButton>

          <DropdownMenu v-if="author.id === me?.id">
            <DropdownButton @click="editHandler">Изменить</DropdownButton>
            <DropdownButton @click="deleteHandler" danger>Удалить</DropdownButton>
          </DropdownMenu>
        </Toolbar>
    
      </div>
      <div ref="sentinelAbove" class="absolute bottom-0 left-0 w-full h-[1px] pointer-events-none"></div>
    </post-wrapper>

    <div v-if="isCommentsOpen" v-auto-animate>
      <CommentList :sentinel-above="elementRef" @close-comments="toggleComments" :post-id="id"></CommentList>
    </div>
  </article>
</template>

<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate'
import { useAuthStore } from '~/stores/auth';
import { usePostStore } from '~/stores/post';
import type { IPost } from '~/types/PostTypes';

const isCommentsOpen = ref<boolean>(false);
const { user: me } = storeToRefs(useAuthStore())
const props = defineProps<IPost>()
const postsStore = usePostStore()
const { deletePost, openEditModal, toggleReaction } = postsStore
const {createPostUrl} = useCreatePostUrl()
const sentinelAbove = ref<HTMLElement | null>(null)
const elementRef = ref<HTMLElement | null>(null)

onMounted(() => {
  elementRef.value = sentinelAbove.value
})

function likeHandler() {
    toggleReaction({
        target: {
            value: props.id,
            relationTo: 'posts'
        },
        type: 'like'
    })
}

const toggleComments = () => {
  isCommentsOpen.value = !isCommentsOpen.value
}

async function deleteHandler() {
  if(!confirm('Вы уверены что хотите удалить этот пост?')) return
  await deletePost(props.id)
}

function editHandler() {
  openEditModal(props)
}

</script>