<template>
    <div class="relative group w-fit" :class="{ 'cursor-pointer': itsMe }" @click="itsMe && openFileInput()">
        <div class="rounded-full p-0.75"
            :class="itsMe ? 'bg-linear-to-tr from-blue-500 to-purple-500' : 'bg-border-subtle'">
            <Avatar :avatar="user.avatar" :size="isDesktop ? '2xl' : 'xl'"
                class="rounded-full border-4 border-surface-background" />
        </div>
        <template v-if="itsMe">
            <div
                class="absolute inset-0.75 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border-4 border-surface-background pointer-events-none">
                <AppIcon name="camera" :class="['text-white flex opacity-80', isDesktop ? 'size-10' : 'size-8']" />
            </div>

            <button v-if="user.avatar" @click.stop="handleDeleteAvatar"
                class="absolute -bottom-1 -right-1 bg-red-500 text-gray-200 rounded-full p-1 shadow-md hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                title="Удалить аватар">
                <AppIcon name="trash" class="text-white flex size-5" />
            </button>

            <input accept="image/jpeg, image/png" title="Загрузить новый аватар" ref="avatarInput" type="file" class="hidden"
                @change="handleAvatarUpload" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useMediaQuery } from '@vueuse/core'
import type { IUser } from '~/types/user.types'

// На десктопе (sm+) оставляем крупный аватар, на мобильных — уменьшаем.
const isDesktop = useMediaQuery('(min-width: 640px)')

const props = defineProps<{
    user: IUser,
    itsMe: boolean
}>()

const avatarInput = ref<HTMLInputElement | null>(null)
const authStore = useAuthStore()

const { uploadAvatar, deleteAvatar } = authStore

const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const openFileInput = () => {
    avatarInput.value?.click()
}

const resetInput = () => {
    if (avatarInput.value) {
        avatarInput.value.value = ''
    }
}

const handleAvatarUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
        const file = target.files[0]

        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Недопустимый формат файла. Пожалуйста, выберите JPG или PNG.')
            resetInput()
            return
        }

        const formData = new FormData()
        formData.append('avatar', file)
        uploadAvatar(formData).catch((error) => {
            alert(error instanceof Error ? error.message : 'Не удалось загрузить аватар. Попробуйте ещё раз.')
            resetInput()
        })
    }
}

const handleDeleteAvatar = () => {
    if (confirm('Вы действительно хотите удалить аватар?')) {
        deleteAvatar()
    }
}
</script>