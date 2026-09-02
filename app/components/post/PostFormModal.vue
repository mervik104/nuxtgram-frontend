<template>
    <AppModal v-model="isOpen" size="full" padding="none" hide-close @dragenter.prevent="onDragEnter" @dragover.prevent
        @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
        <div ref="sheetRef" class="relative flex h-full min-h-0 flex-col overflow-hidden" :style="sheetStyle"
            @touchstart.passive="onSwipeStart" @touchmove="onSwipeMove" @touchend="onSwipeEnd"
            @touchcancel="onSwipeEnd">
            <Transition name="drag-hint">
                <div v-if="isDragging"
                    class="pointer-events-none absolute inset-x-4 inset-y-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-500 bg-blue-500/10 backdrop-blur-[1px]">
                    <p class="text-base font-medium text-blue-400 sm:text-lg">Отпустите, чтобы добавить фото</p>
                </div>
            </Transition>

            <!-- Компактная шапка: крестик | заголовок | публиковать -->
            <header :class="postForm().header()">
                <button @click="isOpen = false" :class="iconButton({ variant: 'ghost', size: 'md', rounded: 'md' })"
                    aria-label="Закрыть">
                    <AppIcon name="cross" class="size-6 flex" />
                </button>

                <h3 :class="postForm().title()">
                    {{ mode === 'create' ? 'Новый пост' : 'Изменить пост' }}
                </h3>

                <AppButton :loading="isSubmitting" :disabled="!isValide" variant="primary" loader-variant="white"
                    size="sm" :class="postForm().submit()" @click="submitHandler">
                    {{ mode === 'create' ? 'Опубликовать' : 'Сохранить' }}
                </AppButton>
            </header>

            <!-- Черновик -->
            <div v-if="mode === 'create' && isDraft" :class="postForm().draftRow()">
                <p :class="postForm().draft()">Черновик восстановлен</p>
                <button @click="clearInputs" :class="button({ variant: 'ghost', size: 'sm' })">Очистить</button>
            </div>

            <!-- Основная область: единственный скролл-контейнер во всей модалке -->
            <div :class="postForm().main()">
                <textarea ref="textareaRef" v-model="input" :class="postForm().textarea()"
                    placeholder="Напишите что-нибудь..."></textarea>
            </div>

            <!-- Медиа: ряд миниатюр под текстом (только для создания — в редактировании фото пока не сохраняются) -->
            <div v-if="mode === 'create'" :class="postForm().media()">
                <TransitionGroup v-if="selectedImages.length" tag="div" name="thumb" :class="postForm().mediaStrip()">
                    <div v-for="img in selectedImages" :key="img.id" class="relative shrink-0">
                        <img :src="img.preview" :class="postForm().thumb()" alt="" />
                        <button @click="removeImage(img.id)"
                            :class="[iconButton({ variant: 'danger', size: 'sm', rounded: 'md' }), 'absolute -top-1.5 -right-1.5 size-6']"
                            aria-label="Удалить фото">
                            <AppIcon name="cross" class="size-4 flex" />
                        </button>
                    </div>

                    <label v-if="selectedImages.length < MAX_IMAGES" key="add-tile" :class="postForm().addTile()">
                        <AppIcon name="image" class="size-5 flex" />
                        <input type="file" accept="image/*" multiple class="hidden" @change="handleImageSelect" />
                    </label>

                    <span key="counter" :class="postForm().counter()">{{ selectedImages.length }} / {{ MAX_IMAGES
                        }}</span>
                </TransitionGroup>

                <label v-else :class="postForm().emptyMedia()">
                    <AppIcon name="image" class="size-7 flex opacity-60 sm:size-8" />
                    <span class="sm:hidden">Добавить фото</span>
                    <span class="hidden sm:inline">Нажмите или перетащите фото сюда</span>
                    <input type="file" accept="image/*" multiple class="hidden" @change="handleImageSelect" />
                </label>
            </div>
        </div>
    </AppModal>
</template>

<script setup lang="ts">
import { usePostStore } from '~/stores/post'
import type { ICreatePostRequest, IPost } from '~/types/post.types'
import { button, iconButton } from '~/utils/ui/atoms'
import { tv } from 'tailwind-variants'

// Локальный слот-конфиг композера поста (Instagram/VK-стиль): компактная шапка с кнопкой
// публикации, textarea сверху (без вертикального центрирования — оно и давало "прыжки"
// при росте текста), ряд миниатюр под текстом. Единственный overflow-y-auto — на `main`,
// поэтому двойного скролла больше нет.
const postForm = tv({
    slots: {
        header: 'flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 pb-2.5 pt-[calc(0.625rem_+_env(safe-area-inset-top))] sm:px-6 sm:pt-2.5',
        title: 'flex-1 truncate text-center text-base font-semibold text-icon-primary',
        draftRow: 'flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-5 py-2 sm:px-6',
        draft: 'text-sm text-icon-secondary',
        submit: 'shrink-0 sm:px-8 sm:py-2.5 sm:text-base',
        main: 'relative min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-8',
        textarea: 'min-h-[120px] w-full resize-none! bg-transparent text-sm sm:text-base leading-relaxed text-icon-primary placeholder-icon-secondary outline-none focus:outline-none sm:min-h-[160px] sm:text-xl',
        media: 'shrink-0 border-t border-border-subtle px-5 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-3',
        mediaStrip: 'flex items-center gap-2.5 overflow-x-auto',
        thumb: 'h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20',
        addTile: 'flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border-hover text-icon-secondary transition-colors hover:border-blue-500 hover:text-blue-400 sm:h-20 sm:w-20',
        counter: 'ml-auto shrink-0 pl-1 text-xs text-icon-secondary',
        emptyMedia: 'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-hover py-6 text-center text-sm text-icon-secondary transition-colors hover:border-blue-500 hover:bg-surface-secondary hover:text-blue-400 sm:py-8',
    },
})

// Раньше требовался текст — теперь можно опубликовать пост с одними фото, как в Instagram/VK
const isValide = computed(() => normalizeText(input.value).length > 0 || selectedImages.value.length > 0)

type FormProps = | { mode: 'create' } | { mode: 'edit'; post: IPost }

const props = defineProps<FormProps>()
const isOpen = defineModel<boolean>({ required: true })

const { textarea: textareaRef, input } = useTextareaAutosize()
const postStore = usePostStore()
const { isSubmitting } = storeToRefs(postStore)

const isDraft = ref<boolean>(false)
const isDragging = ref<boolean>(false)
const dragCounter = ref(0)
const localStorageContent = 'create-post-content'
const { scrollToPost } = useScrollTo()
const { checkVisibility } = useIsElementVisible()

onMounted(() => {
    textareaRef.value?.focus()
    if (props.mode === 'edit') {
        input.value = props.post.content
    } else {
        const content = localStorage.getItem(localStorageContent)
        if (content) {
            input.value = content
            isDraft.value = true
        }
    }
})

onBeforeUnmount(() => {
    // чтобы не текла память, если модалку закрыли крестиком, а не сабмитом/очисткой
    selectedImages.value.forEach(img => URL.revokeObjectURL(img.preview))
})

watchDebounced(input, (newValue) => {
    if (props.mode === 'create') {
        if (newValue) {
            localStorage.setItem(localStorageContent, newValue)
        } else {
            localStorage.removeItem(localStorageContent)
        }
    }
}, { debounce: 500 })

function clearInputs() {
    input.value = ''
    localStorage.removeItem(localStorageContent)
    isDraft.value = false
    selectedImages.value.forEach(img => URL.revokeObjectURL(img.preview))
    selectedImages.value = []
}

const waitForFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

interface SelectedImage {
    id: string
    file: File
    preview: string
}

const selectedImages = ref<SelectedImage[]>([])
const MAX_IMAGES = 15

// crypto.randomUUID() доступен только в secure context (https или localhost) —
// на дев-сервере по LAN-адресу (http://192.168.x.x) его нет, поэтому со своим фолбэком
let idCounter = 0
function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    idCounter += 1
    return `img-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`
}

function addFiles(files: File[]) {
    const remaining = MAX_IMAGES - selectedImages.value.length
    if (remaining <= 0) return

    files
        .filter(f => f.type.startsWith('image/'))
        .slice(0, remaining)
        .forEach((file) => {
            selectedImages.value.push({
                id: generateId(),
                file,
                preview: URL.createObjectURL(file),
            })
        })
}

function handleImageSelect(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files) addFiles(Array.from(target.files))
    // сбрасываем value — иначе повторный выбор того же файла не вызовет change
    target.value = ''
}

function removeImage(id: string) {
    const idx = selectedImages.value.findIndex(img => img.id === id)
    if (idx === -1) return
    URL.revokeObjectURL(selectedImages.value[idx]!.preview)
    selectedImages.value.splice(idx, 1)
}

// Счётчик вложенных dragenter/dragleave вместо boolean — без него overlay мигал
// при пересечении курсором дочерних элементов во время перетаскивания
function onDragEnter(e: DragEvent) {
    if (props.mode !== 'create' || !e.dataTransfer?.types.includes('Files')) return
    dragCounter.value++
    isDragging.value = true
}

function onDragLeave() {
    if (props.mode !== 'create') return
    dragCounter.value = Math.max(0, dragCounter.value - 1)
    if (dragCounter.value === 0) isDragging.value = false
}

function onDrop(e: DragEvent) {
    dragCounter.value = 0
    isDragging.value = false
    if (props.mode !== 'create') return
    if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}

// Свайп от левого края закрывает модалку — жест "назад", привычный на телефонах.
// Работает независимо от AppModal: просто двигаем контент за пальцем и в конце
// сами решаем, закрывать (isOpen.value = false) или вернуть на место.
const sheetRef = ref<HTMLElement | null>(null)
const dragX = ref(0)
const isDraggingSheet = ref(false)
const sheetWidth = ref(0)
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let trackingSwipe = false

const EDGE_ZONE = 24 // зона у левого края, с которой можно начать жест, в px
const CLOSE_THRESHOLD_RATIO = 0.35 // утащили дальше 35% ширины — закрываем
const CLOSE_VELOCITY = 0.5 // либо просто резко смахнули — px/ms

function onSwipeStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    if (touch.clientX > EDGE_ZONE) return
    trackingSwipe = true
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()
    sheetWidth.value = sheetRef.value?.offsetWidth || window.innerWidth
    isDraggingSheet.value = true
}

function onSwipeMove(e: TouchEvent) {
    if (!trackingSwipe) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY

    // ведёт скорее вертикально — это не наш жест, отпускаем
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        trackingSwipe = false
        isDraggingSheet.value = false
        dragX.value = 0
        return
    }

    if (dx > 0) {
        e.preventDefault()
        dragX.value = dx
    }
}

function onSwipeEnd() {
    if (!trackingSwipe) return
    trackingSwipe = false
    isDraggingSheet.value = false

    const elapsed = Date.now() - touchStartTime
    const velocity = dragX.value / Math.max(elapsed, 1)
    const shouldClose = dragX.value > 0
        && (dragX.value > sheetWidth.value * CLOSE_THRESHOLD_RATIO || velocity > CLOSE_VELOCITY)

    if (shouldClose) {
        dragX.value = sheetWidth.value
        setTimeout(() => { isOpen.value = false }, 200)
    } else {
        dragX.value = 0
    }
}

const sheetStyle = computed(() => {
    if (!dragX.value) return undefined
    return {
        transform: `translateX(${dragX.value}px)`,
        opacity: Math.max(1 - dragX.value / (sheetWidth.value * 1.3), 0.5),
        transition: isDraggingSheet.value ? 'none' : 'transform 0.25s ease, opacity 0.25s ease',
    }
})

async function submitHandler() {
    if (props.mode === 'create') {
        let payload: FormData | ICreatePostRequest
        if (selectedImages.value.length > 0) {
            const formData = new FormData()
            formData.append('content', input.value)
            selectedImages.value.forEach(img => formData.append('image', img.file))
            payload = formData
        } else {
            payload = { content: input.value }
        }
        const newPost = await postStore.createPost(payload)
        clearInputs()
        isOpen.value = false
        await nextTick()
        await waitForFrame()
        const isPostVisible = await checkVisibility(`post-${newPost.id}`)
        if (!isPostVisible) {
            scrollToPost(newPost.id, { highlight: true })
        }
    } else {
        await postStore.editPost({ content: input.value }, props.post.id)
        input.value = ''
        isOpen.value = false
    }
}
</script>

<style scoped>
.thumb-enter-active,
.thumb-leave-active,
.thumb-move {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.thumb-enter-from,
.thumb-leave-to {
    opacity: 0;
    transform: scale(0.85);
}

.drag-hint-enter-active,
.drag-hint-leave-active {
    transition: opacity 0.15s ease;
}

.drag-hint-enter-from,
.drag-hint-leave-to {
    opacity: 0;
}
</style>