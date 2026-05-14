<template>
    <div v-if="me && follows && follows.followingCount > 0" class="mt-6 border-t border-gray-700/50 pt-2">
        <NuxtLink to="/subscriptions">
            <div class="flex items-center gap-3 mb-1 cursor-pointer py-2 mt-2 px-3 hover:bg-gray-700/50 rounded-xl">
                <h4 class=" text-gray-200 text-lg">Подписки</h4>
                <AppIcon name="right" class="text-gray-100 font-sans" />
            </div>
        </NuxtLink>

        <div class="flex flex-col">
            <div v-for="follow in sortedFollowing" :key="follow.id">
                <NuxtLink :to="`/profile/${follow.nickname}`" class="flex items-center gap-3">
                    <UserCard :user="follow" />
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { useFollowsStore } from '~/stores/follows';
const { getMe } = useAuthStore()
const followsStore = useFollowsStore()

const me = await getMe()
const userId = me.value!.id

const { getFollows } = followsStore
await getFollows(userId)

const follows = computed(() => followsStore.follows[userId])

const sortedFollowing = computed(() =>
    [...(follows.value?.following ?? [])].sort((a, b) =>
        a.nickname.localeCompare(b.nickname)
    )
)
</script>