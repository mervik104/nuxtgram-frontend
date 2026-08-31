<template>
  <article class="mb-3 sm:mb-4" :id="`post-${props.id}`">
    <PostLayout>
      <UserCard :user="author" :date="formatSocialDate(createdAt)" :size="'post'" />
      <div class="relative">

        <div class="my-1.5 sm:my-2">
          <MediaGallery v-if="props.image" :images="props.image" ></MediaGallery>
        </div>

        <TextBody class="pl-0 sm:pl-2">{{ content }}</TextBody>
        <Toolbar>

          <ToolbarButton @click="likeHandler" title="Лайк">
            <LikeIcon class="size-6" :myReaction="!!myReaction" />
            <span>{{ formatCompactNumber(reactionsCount.like) }}</span>
          </ToolbarButton>

          <ToolbarButton @click="isCommentsOpen = !isCommentsOpen" title="Комментарии">
            <AppIcon name="message" class="size-5.5 text-icon-accent flex" />
            <span>{{ formatCompactNumber(commentsCount) }}</span>
          </ToolbarButton>

          <ToolbarButton @click="() => createPostUrl(props.id)" title="Поделиться">
            <AppIcon name="share" class="size-5.5 text-icon-accent flex" />
          </ToolbarButton>

          <DropdownMenu v-if="author.id === me?.id">
            <DropdownButton @click="editHandler">Изменить</DropdownButton>
            <DropdownButton @click="deleteHandler" danger>Удалить</DropdownButton>
          </DropdownMenu>
        </Toolbar>
    
      </div>
      <div ref="sentinelAbove" class="absolute bottom-0 left-0 w-full h-px pointer-events-none"></div>
    </PostLayout>

    <div v-if="isCommentsOpen" v-auto-animate>
      <CommentList :sentinel-above="elementRef" :post="props" :fullscreen="isMobile"
        @close-comments="toggleComments" :post-id="id"></CommentList>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useAuthStore } from '~/stores/auth';
import { usePostStore } from '~/stores/post';
import type { IPost } from '~/types/post.types';
import PostLayout from './PostLayout.vue';

const isCommentsOpen = ref<boolean>(false);
// На мобильных (<640px) комментарии открываются полноэкранным шитом, на десктопе —
// остаются инлайново под постом. Определяем по ширине экрана (брейкпоинт sm).
const isMobile = useMediaQuery('(max-width: 639px)')
const { user: me } = storeToRefs(useAuthStore())
const props = defineProps<IPost>()
const postsStore = usePostStore()
const { deletePost, openEditModal, toggleReaction } = postsStore
const {createPostUrl} = usePostLink()
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