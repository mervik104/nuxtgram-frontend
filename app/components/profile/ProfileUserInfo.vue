<template>
    <div class="flex-1 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-white">{{ user.username }}</h1>
            <span class="text-gray-500 font-mono">@{{ user.nickname }}</span>

            <div class="sm:ml-auto flex gap-2">
                <BaseButton
                    v-if="itsMe"
                    variant="outline"
                    size="base"
                    @click="emit('openEditModalHandler')"
                >
                    Изменить профиль
                </BaseButton>

                <BaseButton
                    v-else
                    variant="primary"
                    size="base"
                    @click="emit('subscribeHandler')"
                >
                    Подписаться
                </BaseButton>
            </div>
        </div>

        <p class="text-sm leading-relaxed text-gray-400">
            {{ user.bio || 'Описание пока нет...' }}
        </p>

        <div class="flex gap-4 mt-3 text-sm text-gray-500">
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(feedMeta ? feedMeta.totalDocs : 0) }}</span> публикаций</span>
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(1654) }}</span> подписчиков</span>
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(340) }}</span> подписок</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IPaginationMeta } from '~/types/CommonTypes';
import type { IUser } from '~/types/UserTypes';

defineProps<{
    feedMeta: IPaginationMeta | null
    user: IUser,
    itsMe: boolean
}>()

const emit = defineEmits<{
  (e: 'openEditModalHandler'): void,
  (e: 'subscribeHandler'): void,
}>()
</script>