<template>
    <div class="flex-1 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-white">{{ user.username }}</h1>
            <span class="text-gray-500 font-mono">@{{ user.nickname }}</span>

            <div v-if="follows" class="sm:ml-auto flex gap-2">
                <div v-if="itsMe">
                    <BaseButton variant="outline" size="base" @click="emit('openEditModalHandler')">
                        Изменить профиль
                    </BaseButton>
                </div>
                <div v-else>
                    <BaseButton v-if="!follows.isFollowing" @click="follow(props.user.id)" 
                    variant="primary"
                    size="base">
                        Подписаться
                    </BaseButton>

                    <BaseButton v-if="follows.isFollowing" variant="outline" size="base"
                        @click="unfollow(props.user.id)">
                        Отписаться
                    </BaseButton>
                </div>
            </div>
        </div>

        <p class="text-sm leading-relaxed text-gray-400">
            {{ user.bio || 'Описание пока нет...' }}
        </p>

        <div v-if="follows" class="flex gap-4 mt-3 text-sm text-gray-500">
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(feedMeta ? feedMeta.totalDocs : 0)}}</span> публикаций</span>
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(follows.followersCount) }}</span>
                подписчиков</span>
            <span><span class="font-medium text-gray-300">{{ formatCompactNumber(follows.followingCount) }}</span>
                подписок</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useFollowsStore } from '~/stores/follows';
import type { IPaginationMeta } from '~/types/CommonTypes';
import type { IUser } from '~/types/UserTypes';

const props = defineProps<{
    feedMeta: IPaginationMeta | null
    user: IUser,
    itsMe: boolean
}>()

const { getFollows, follow, unfollow } = useFollowsStore()
const follows = await getFollows(props.user.id)

const emit = defineEmits<{
    (e: 'openEditModalHandler'): void,
    (e: 'subscribeHandler'): void,
}>()
</script>