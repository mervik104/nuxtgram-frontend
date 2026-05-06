<template>
    <div class="flex items-center gap-3 px-2 py-2 cursor-pointer select-none" @click="$emit('toggleHidden')">
        <Avatar :avatar="avatar" size="md" />
        <div class="flex-1 min-w-0">
            <h4 class="text-md font-medium text-gray-200 truncate">{{ username }}</h4>
            <p @click.stop="copyId"
                class="text-sm font-mono text-gray-500 hover:text-gray-400 active:text-gray-300 cursor-pointer truncate">
                @{{ nickname }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/UserTypes'

const props = defineProps<IUser>()

defineEmits<{
    (e: 'toggleHidden'): void
}>()

function copyId() {
    const toast = useNotification()
    navigator.clipboard.writeText(props.nickname)
    toast.success({ message: 'ID скопирован в буфер обмена' })
}

</script>