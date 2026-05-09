<template>
    <BaseModal v-model="isOpen" @dragover.prevent="isDragging = true" @dragleave="isDragging = false"
        @drop.prevent="handleDrop">
        <div class="relative">
            <div v-if="isDragging"
                class="absolute inset-0 border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/10 z-10 flex items-center justify-center pointer-events-none">
                <p class="text-blue-400 text-lg">Перетащите фото сюда</p>
            </div>

            <h3 class="text-xl text-center mb-5">
                {{ mode === 'create' ? 'Новый пост' : 'Изменить пост' }}
            </h3>

            <div v-if="mode === 'create' && isDraft" class="flex justify-between pb-2">
                <p class="text-red-400 text-sm">Черновик</p>
                <button @click="clearInputs" :class="button({ variant: 'ghost', size: 'sm' })">
                    Очистить
                </button>
            </div>

            <div>
                <textarea ref="textareaRef" v-model="input"
                    :class="[textarea(), 'mb-5 border-0 !min-w-[600px] !min-h-[550px] !max-h-[700px]']"
                    placeholder="Напишите что-нибудь...">
                </textarea>

                <div v-if="selectedImages.length" class="flex gap-2 flex-wrap mb-3">
                    <div v-for="(img, idx) in selectedImages" :key="idx" class="relative">
                        <img :src="img.preview" class="w-20 h-20 object-cover rounded-lg" />
                        <button @click="removeImage(idx)"
                            class="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                            ×
                        </button>
                    </div>
                </div>

                <div v-if="selectedImages.length" class="flex justify-between items-center mb-3">
                    <span class="text-xs text-gray-400">
                        {{ selectedImages.length }} / {{ MAX_IMAGES }}
                    </span>
                    <span v-if="selectedImages.length >= MAX_IMAGES" class="text-xs text-red-400">
                        Достигнут лимит фотографий
                    </span>
                </div>

                <div class="flex justify-between items-center">
                    <label v-if="selectedImages.length < MAX_IMAGES && mode === 'create'" :class="button({ variant: 'text', size: 'sm' })">
                        <BaseIcon name="image" class="size-7 flex"/>
                        <span>Добавить фото</span>
                        <input type="file" accept="image/*" multiple class="hidden" @change="handleImageSelect" />
                    </label>
                    <div v-else />

                    <BaseButton :loading="isSubmitting" :disabled="!isValide" variant="primary" loader-variant="white"
                        @click="submitHandler">
                        {{ mode === 'create' ? 'Опубликовать' : 'Изменить' }}
                    </BaseButton>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { usePostStore } from '~/stores/post'
import type { ICreatePostRequest, IPost } from '~/types/PostTypes'
import { button, textarea } from '~/utils/ui/atoms'

const isValide = computed(() => normalizeText(input.value).length > 0)

type FormProps = | { mode: 'create' } | { mode: 'edit'; post: IPost }

const props = defineProps<FormProps>()
const isOpen = defineModel<boolean>({ required: true })

const { textarea: textareaRef, input } = useTextareaAutosize()
const postStore = usePostStore()
const { isSubmitting } = storeToRefs(postStore)

const isDraft = ref<boolean>(false)
const isDragging = ref<boolean>(false)
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

const selectedImages = ref<{ file: File; preview: string }[]>([])
const MAX_IMAGES = 15

function handleImageSelect(e: Event) {
    const files = (e.target as HTMLInputElement).files
    if (!files) return

    const remaining = MAX_IMAGES - selectedImages.value.length
    if (remaining <= 0) return

    const filesToAdd = Array.from(files).slice(0, remaining)
    for (const file of filesToAdd) {
        selectedImages.value.push({
            file,
            preview: URL.createObjectURL(file)
        })
    }
}

function removeImage(idx: number) {
    if (selectedImages.value[idx]) {
        URL.revokeObjectURL(selectedImages.value[idx].preview)
        selectedImages.value.splice(idx, 1)
    }
}

function handleDrop(e: DragEvent) {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (!files) return

    const remaining = MAX_IMAGES - selectedImages.value.length
    const filesToAdd = Array.from(files)
        .filter(f => f.type.startsWith('image/'))
        .slice(0, remaining)

    for (const file of filesToAdd) {
        selectedImages.value.push({
            file,
            preview: URL.createObjectURL(file)
        })
    }
}

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