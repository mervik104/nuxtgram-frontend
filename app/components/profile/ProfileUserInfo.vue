<template>
    <!-- need refactor -->
    <div class="flex-1 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-gray-100">{{ user.username }}</h1>
            <span class="text-gray-500 font-light">@{{ user.nickname }}</span>

            <div class="sm:ml-auto flex gap-2">
                <button v-if="itsMe"
                    class="px-5 py-1.5 text-sm font-medium rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                    @click="emit('openEditModalHandler')">
                    Изменить профиль
                </button>
                <button v-else
                    @click="emit('subscribeHandler')"
                    class="px-5 py-1.5 text-sm font-semibold rounded-lg bg-white text-black hover:bg-gray-200 transition-colors">
                    Подписаться
                </button>
            </div>
        </div>

        <p class="text-gray-400 text-sm leading-relaxed">
            {{user.bio || 'Описание пока нет...' }}
        </p>

        <div class="flex gap-4 mt-3 text-sm text-gray-500">
            <span><b class="text-gray-300">{{ formatCompactNumber(157) }}</b> публикаций</span>
            <span><b class="text-gray-300">{{ formatCompactNumber(1654) }}</b> подписчиков</span>
            <span><b class="text-gray-300">{{ formatCompactNumber(340) }}</b> подписок</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/UserTypes';

defineProps<{
    user: IUser,
    itsMe: boolean
}>()

const emit = defineEmits<{
  (e: 'openEditModalHandler'): void,
  (e: 'subscribeHandler'): void,
}>()

</script>