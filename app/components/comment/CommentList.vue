<template>
    <CommentBorder @close="closeCommentsHandler" v-model="isPostVisible">
        <div class="w-full">
            <SmartScrollButton :is-visible="isPostVisible" :scroll-offset="32"
                :class="button({ variant: 'primary', size: 'sm', rounded: 'full', class: 'left-1/2 -translate-x-1/2 shadow-lg' })"
                @click="scrollToPost(props.postId, { highlight: false })">

                <div class="flex items-center justify-center gap-0.5">
                    <AppIcon name="arrowUpDashed" class="size-6"/>
                    <span class="text-sm">К посту</span>
                </div>
                
            </SmartScrollButton>

            <div class="p-4 pb-5">
                <div v-if="commentsList.length" class="relative" v-auto-animate>
                    <CommentItem v-for="comment in commentsList" :key="comment.id"
                        @delete-comment="deleteCommentHandler" @edit-comment="() => { onEditMode(comment) }"
                        @set-like="toggleReactionHandler" v-bind="comment" />
                </div>

                <div v-else-if="!isLoading && commentsMeta?.totalDocs === 0">
                    <p class="text-gray-400">Комментариев пока нет</p>
                </div>

                <div v-if="canLoadMore && !isLoading" class="mt-3">
                    <span class="select-none text-gray-400 hover:underline cursor-pointer" @click="loadNextPageHandler">
                        Показать ещё...
                    </span>
                </div>
            </div>
        </div>

        <div ref="sentinelBelow" class="absolute bottom-0 left-0 w-full h-px pointer-events-none"></div>

        <div class="flex items-center justify-center">
            <TransitionDrop>
                <AppLoader :is-center="true" v-if="isLoading" size="sm" theme="muted" />
            </TransitionDrop>
        </div>

        <div v-if="me" @focusin="isFocus = true" @focusout="isFocus = false"
            :class="`sticky transition-colors duration-500 border-t -bottom-6 z-99 p-2 
            ${isSticky && !isFocus
            ? 'rounded-t-xl bg-[#1F2A3E]/60 border-[#39425a]/60'
            : isFocus && isSticky ? 'rounded-t-xl bg-[#1F2A3E] border-[#39425a]' 
            : 'rounded-xl border-transparent'}`">
            <CommentCreateInput @edit-comment="editCommentHandler" v-model="isEditingComment"
                @add-comment="addCommentHandler" />
        </div>
    </CommentBorder>
</template>

<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate';
import App from '~/app.vue';
import { useAuthStore } from '~/stores/auth';
import { useCommentStore } from '~/stores/comment';
import type { IComment } from '~/types/comment.types.ts';
import type { IReactionRequest } from '~/types/reaction.types';
import { button } from '~/utils/ui/atoms';

const { user: me } = storeToRefs(useAuthStore())
const props = defineProps<{ postId: string, sentinelAbove: HTMLElement | null }>()
const emit = defineEmits<{
    (e: 'close-comments'): void,
}>()

const commentStore = useCommentStore()
const commentsList = computed(() => commentStore.getCommentsByPostId(props.postId))
const commentsMeta = computed(() => commentStore.feeds[props.postId]?.meta ?? null)
const isLoading = computed(() => commentStore.feeds[props.postId]?.isLoading ?? false)
const canLoadMore = computed(() => commentStore.canLoadMoreComments(props.postId))

const isEditingComment = ref<IComment | null>(null)
const isFocus = ref(false)

const sentinelBelow = ref<HTMLElement | null>(null);
const sentinelAbove = ref<HTMLElement | null>(null);
const { isPostVisible, isSticky } = useVisibilityObserver(sentinelAbove, sentinelBelow)
const { scrollToComment, scrollToPost } = useScrollTo()

onMounted(async () => {
    sentinelAbove.value = props.sentinelAbove
    await commentStore.fetchComments(props.postId)
});

async function loadNextPageHandler() {
    if (!commentsMeta.value?.nextPage) return
    await commentStore.fetchComments(props.postId, commentsMeta.value.nextPage)
}

function closeCommentsHandler() {
    scrollToPost(props.postId)
    emit('close-comments')
}

function onEditMode(comment: IComment) {
    isEditingComment.value = comment
}

async function addCommentHandler(input: Ref<string>) {
    const comment = {
        content: input.value,
        post: props.postId
    }
    const newComment = await commentStore.createComment(comment)
    if (!isPostVisible.value) {
        scrollToComment(newComment.id)
    }
    input.value = ''
}

async function toggleReactionHandler(comment: IComment) {
    const reaction: IReactionRequest = {
        target: {
            value: comment.id,
            relationTo: 'comments'
        },
        type: 'like'
    }
    await commentStore.toggleCommentReaction(reaction)
}

async function deleteCommentHandler(commentId: string) {
    await commentStore.deleteComment(props.postId, commentId)
}

async function editCommentHandler(input: Ref<string>, commentId: string) {
    const comment = {
        content: input.value,
        post: props.postId
    }
    await commentStore.editComment(comment, commentId)
}
</script>