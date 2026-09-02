<template>
    <!-- Мобильный полноэкранный шит комментариев (Instagram/VK): сверху пост,
         под ним лента комментариев и поле ввода, прижатое к низу. Показывается
         только на мобильных (fullscreen=true); на десктопе — инлайновый вид ниже. -->
    <AppModal v-if="fullscreen" v-model="isOpen" size="full" padding="none" hide-close>
        <div class="flex h-full flex-col bg-surface-background text-icon-primary">

            <div class="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 pb-2.5 pt-[calc(0.625rem_+_env(safe-area-inset-top))]">
                <span class="text-base font-semibold">Комментарии</span>
                <button :class="iconButton({ variant: 'ghost', size: 'sm', rounded: 'full' })"
                    @click="closeCommentsHandler" aria-label="Закрыть комментарии">
                    <AppIcon name="cross" class="size-5" />
                </button>
            </div>

            <!-- Пост + комментарии в ОДНОМ скроллящемся регионе: даже очень длинный
                 пост скроллится вместе с комментариями, а поле ввода остаётся прижатым
                 к низу и всегда доступно. -->
            <div class="min-h-0 flex-1 overflow-y-auto">
                <div v-if="post" class="border-b border-border-subtle px-3 py-3">
                    <UserCard :user="post.author" :date="formatSocialDate(post.createdAt)" size="post" />
                    <div v-if="post.image?.length" class="my-2">
                        <MediaGallery :images="post.image" />
                    </div>
                    <TextBody class="pl-0">{{ post.content }}</TextBody>
                </div>

                <div class="px-3 py-3">
                    <div v-if="commentsList.length" class="relative" v-auto-animate>
                        <CommentItem v-for="comment in commentsList" :key="comment.id"
                            @delete-comment="deleteCommentHandler" @edit-comment="() => { onEditMode(comment) }"
                            @set-like="toggleReactionHandler" v-bind="comment" />
                    </div>

                    <div v-else-if="!isLoading && commentsMeta?.totalDocs === 0">
                        <p class="text-icon-secondary">Комментариев пока нет</p>
                    </div>

                    <div v-if="canLoadMore && !isLoading" class="mt-3">
                        <span class="select-none text-icon-secondary hover:underline cursor-pointer" @click="loadNextPageHandler">
                            Показать ещё...
                        </span>
                    </div>

                    <div class="flex items-center justify-center py-2">
                        <TransitionDrop>
                            <AppLoader v-if="isLoading" :is-center="false" size="sm" theme="muted" />
                        </TransitionDrop>
                    </div>
                </div>
            </div>

            <div class="shrink-0 border-t border-border-subtle p-2 pb-[calc(0.5rem_+_env(safe-area-inset-bottom))]">
                <CommentCreateInput v-if="me" mobile @edit-comment="editCommentHandler" v-model="isEditingComment"
                    @add-comment="addCommentHandler" />
            </div>
        </div>
    </AppModal>

    <!-- Десктоп: текущий инлайновый вид (без изменений). -->
    <CommentBorder v-else @close="closeCommentsHandler" v-model="isPostVisible">
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
                    <p class="text-icon-secondary">Комментариев пока нет</p>
                </div>

                <div v-if="canLoadMore && !isLoading" class="mt-3">
                    <span class="select-none text-icon-secondary hover:underline cursor-pointer" @click="loadNextPageHandler">
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
import { useAuthStore } from '~/stores/auth';
import { useCommentStore } from '~/stores/comment';
import type { IComment } from '~/types/comment.types.ts';
import type { IPost } from '~/types/post.types';
import type { IReactionRequest } from '~/types/reaction.types';
import { button, iconButton } from '~/utils/ui/atoms';

const { user: me } = storeToRefs(useAuthStore())
const props = withDefaults(defineProps<{
    postId: string,
    sentinelAbove: HTMLElement | null,
    fullscreen?: boolean,
    post?: IPost | null,
}>(), {
    fullscreen: false,
    post: null,
})
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

// Состояние открытия мобильного шита. При закрытии (крестик/свайп) сообщаем родителю.
const isOpen = ref(true)
watch(isOpen, (val) => { if (!val && props.fullscreen) closeCommentsHandler() })

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
    if (!props.fullscreen) scrollToPost(props.postId)
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
