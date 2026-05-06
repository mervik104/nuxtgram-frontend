<template>
    <div class="relative group w-fit" :class="{ 'cursor-pointer': itsMe }" @click="itsMe && openFileInput()">
        <div class="rounded-full p-[3px]"
            :class="itsMe ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : 'bg-gray-700'">
            <Avatar :avatar="user.avatar" size="2xl" class="rounded-full border-4 border-base-dark" />
        </div>
        <template v-if="itsMe">
            <div
                class="absolute inset-[3px] rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border-4 border-base-dark pointer-events-none">
                <BaseIcon name="camera" class="text-white flex size-10 opacity-80" />
            </div>

            <button v-if="user.avatar" @click.stop="handleDeleteAvatar"
                class="absolute -bottom-1 -right-1 bg-red-500 text-gray-200 rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Удалить аватар">
                <BaseIcon name="trash" class="text-white flex size-5" />
            </button>

            <input accept="image/jpeg, image/png" title="Загрузить новый аватар" ref="avatarInput" type="file" class="hidden"
                @change="handleAvatarUpload" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { IUser } from '~/types/UserTypes'

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
        uploadAvatar(formData)
    }
}

const handleDeleteAvatar = () => {
    if (confirm('Вы действительно хотите удалить аватар?')) {
        deleteAvatar()
    }
}
</script>