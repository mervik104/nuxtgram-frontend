<template>
    <div v-if="me && follows && follows.followingCount > 0" class="mt-6 border-t border-border-subtle pt-2">
        <NuxtLink :to="navRoutes.subscriptions">
            <div class="flex items-center gap-3 mb-1 cursor-pointer py-2 mt-2 px-3 hover:bg-surface-accent-hover rounded-xl">
                <h4 class=" text-icon-primary text-lg">Подписки</h4>
                <AppIcon name="right" class="text-icon-secondary font-sans" />
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
import { navRoutes } from '~/data/navigation';
const { getMe } = useAuthStore()
const followsStore = useFollowsStore()

const me = await getMe()
const userId = me.value?.id

const { getFollows } = followsStore
if (userId) await getFollows(userId)

const follows = computed(() => (userId ? followsStore.follows[userId] : undefined))

const sortedFollowing = computed(() =>
    [...(follows.value?.following ?? [])].sort((a, b) =>
        a.nickname.localeCompare(b.nickname)
    )
)
</script>