<template>
    <BaseModal v-model="isOpen">
        <div>
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
                <textarea 
                    ref="textareaRef" 
                    v-model="input"
                    :class="[textarea(), 'mb-5 border-0 !w-[600px] !min-h-[550px] !max-h-[700px]']"
                    placeholder="Напишите что-нибудь...">
                </textarea>

                <div class="flex justify-end">
                    <BaseButton :loading="isSubmitting" 
                    :disabled="!isValide" 
                    variant="primary"
                    loader-variant="white"
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
import type { IPost } from '~/types/PostTypes'
import { button, textarea } from '~/utils/ui/atoms'

const isValide = computed(() => normalizeText(input.value).length > 0)

type FormProps = 
    | { mode: 'create' } 
    | { mode: 'edit'; post: IPost }

const props = defineProps<FormProps>()
const isOpen = defineModel<boolean>({ required: true })

const { textarea: textareaRef, input } = useTextareaAutosize()
const postStore = usePostStore()
const { isSubmitting } = storeToRefs(postStore)

const isDraft = ref<boolean>(false)
const localStorageContent = 'create-post-content'

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

watch(input, (newValue) => {
    if (props.mode === 'create') {
        localStorage.setItem(localStorageContent, newValue)
    }
})

function clearInputs() {
    input.value = ''
    localStorage.removeItem(localStorageContent)
    isDraft.value = false
}

async function submitHandler() {
    if (props.mode === 'create') {
        await postStore.createPost({ content: input.value })
        clearInputs()
    } else {
        await postStore.editPost({ content: input.value }, props.post.id)
        input.value = ''
    }
    
    isOpen.value = false
}
</script>