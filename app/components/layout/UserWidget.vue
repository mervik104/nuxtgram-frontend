<template>
    <div class="px-5 py-2">
        <div class="text-md select-none flex gap-4 items-center">
            <HeaderButtonWrapper @click="emit('toggleHidden')">
                <Avatar :avatar="props.avatar" size="md" />
            </HeaderButtonWrapper>
            <span class="flex-1 my-auto">
                <div>
                    <h4 class="cursor-pointer hover:text-gray-200" @click="emit('toggleHidden')">
                        {{ username }}
                    </h4>
                    <p @click="copyId"
                        class="text-sm font-mono select-text hover:text-gray-400 active:text-gray-300 cursor-pointer text-gray-500">
                        @{{ nickname }}
                    </p>
                </div>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { IUser } from '~/types/UserTypes';
const props = defineProps<IUser>()

const emit = defineEmits<{
    (e: 'toggleHidden'): void
}>()

function copyId() {
    navigator.clipboard.writeText(props.nickname)
}
</script>