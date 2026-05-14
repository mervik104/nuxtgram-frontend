<template>
  <article class="mb-4" :id="`post-${props.id}`">
    <post-wrapper>
      <UserCard :user="author" :date="formatSocialDate(createdAt)" :size="'post'" />
      <div class="relative">

        <div class="my-2">
          <MediaGallery v-if="props.image" :images="props.image" ></MediaGallery>
        </div>

        <TextBody class="pl-2">{{ content }}</TextBody>
        <Toolbar>

          <ToolbarButton @click="likeHandler" title="Лайк">
            <LoveIcon class="size-6" :myReaction="!!myReaction" />
            <span>{{ formatCompactNumber(reactionsCount.like) }}</span>
          </ToolbarButton>

          <ToolbarButton @click="isCommentsOpen = !isCommentsOpen" title="Комментарии">
            <BaseIcon name="message" class="size-5.5 text-icon-access flex" />
            <span>{{ formatCompactNumber(commentsCount) }}</span>
          </ToolbarButton>

          <ToolbarButton @click="() => createPostUrl(props.id)" title="Поделиться">
            <BaseIcon name="share" class="size-6 text-icon-access flex" />
          </ToolbarButton>

          <DropdownMenu v-if="author.id === me?.id">
            <DropdownButton @click="editHandler">Изменить</DropdownButton>
            <DropdownButton @click="deleteHandler" danger>Удалить</DropdownButton>
          </DropdownMenu>
        </Toolbar>
    
      </div>
      <div ref="sentinelAbove" class="absolute bottom-0 left-0 w-full h-px pointer-events-none"></div>
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