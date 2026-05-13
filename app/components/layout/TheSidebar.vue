<template>
  <aside class="w-64 shrink-0 border-r border-gray-700/50 overflow-y-auto p-5">
    <SidebarItem to="/" content="Главная">
      <BaseIcon name="home" />
    </SidebarItem>
    <SidebarItem to="/feed" content="Лента">
      <BaseIcon name="home" />
    </SidebarItem>

    <div v-if="me && follows!.followingCount > 0 || false" class="mt-6 border-t border-gray-700/50 pt-2">
      <h2 class="text-sm font-semibold text-gray-400 uppercase text-center mb-5">Подписки</h2>
      <div class="flex flex-col">
        <div v-for="follow in sortedFollowing" :key="follow.id">
          <NuxtLink :to="`/profile/${follow.nickname}`" class="flex items-center gap-3">
            <UserCard :user="follow" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </aside>
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
