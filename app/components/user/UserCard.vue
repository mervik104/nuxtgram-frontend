<template>
  <div v-if="size === 'sm'" class="flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full">
    <Avatar size="sm" :avatar="user.avatar" :alt="user.username" />
    <h3 class="text-md text-center">{{ user.username }}</h3>
  </div>

  <div v-else-if="size === 'md'" class="flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full">
    <Avatar size="md" :avatar="user.avatar" :alt="user.username" />
    <h3 class="text-lg text-center">{{ user.username }}</h3>
  </div>

  <div v-else-if="size === 'lg'" class="flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full">
    <Avatar size="xl" :avatar="user.avatar" :alt="user.username" />
    <div class="flex flex-col flex-1">
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-xl">{{ user.username }}</h3>
        <div v-if="follows" class="ml-auto" @click.stop>
          <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
            @openEditModalHandler="emit('openEditModalHandler')" />
        </div>
      </div>
      <div class="text-gray-400 text-[12px] mb-1 flex gap-1">
        <span>@{{ user.nickname }}</span>
        <span>·</span>
        <span v-if="follows">{{ `${follows?.followersCount} ${pluralFollowers(follows?.followersCount)}` }}</span>
      </div>
      <p class="text-gray-400 text-[12px] mb-1">{{ user.bio || bioPlaceholder }}</p>
    </div>
  </div>

  <div v-else-if="size === 'profile'" class="flex-1 w-full">
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
      <h1 class="text-2xl font-bold text-white">{{ user.username }}</h1>
      <span class="text-gray-500 font-mono">@{{ user.nickname }}</span>
      <div v-if="follows" class="sm:ml-auto flex gap-2">
        <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
          @openEditModalHandler="emit('openEditModalHandler')" />
      </div>
    </div>
    <p class="text-sm leading-relaxed text-gray-400">
      {{ user.bio || bioPlaceholder }}
    </p>
    <div v-if="follows" class="flex gap-4 mt-3 text-sm text-gray-500">
      <ProfileStatChip :stat="feedMeta ? feedMeta.totalDocs : 0">
        {{ pluralPublications(feedMeta?.totalDocs || 0) }}
      </ProfileStatChip>

      <ProfileStatChip :class="itsMe ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''"
        @click="subscribersHandler" :stat="follows?.followersCount">
        {{ pluralFollowers(follows?.followersCount) }}
      </ProfileStatChip>

      <ProfileStatChip :class="itsMe ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''"
        @click="subscriptionsHandler" :stat="follows?.followingCount">
        {{ pluralFollowing(follows?.followingCount) }}
      </ProfileStatChip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFollowsStore } from '~/stores/follows'
import type { IPaginationMeta } from '~/types/CommonTypes'
import type { IUser } from '~/types/UserTypes'

const bioPlaceholder = 'Описания пока нет...'

const props = withDefaults(defineProps<{
  user: IUser
  size?: 'sm' | 'md' | 'lg' | 'profile'
  feedMeta?: IPaginationMeta | null
  itsMe?: boolean
}>(), {
  size: 'sm',
  feedMeta: null,
  itsMe: false
})

const emit = defineEmits<{
  (e: 'openEditModalHandler'): void
}>()

const followsStore = useFollowsStore()
const follows = computed(() =>
  ['lg', 'profile'].includes(props.size) ? followsStore.follows[props.user.id] : null
)

if (['lg', 'profile'].includes(props.size)) {
  const { getFollows } = followsStore
  await getFollows(props.user.id)
}

const subscriptionsHandler = () => (props.itsMe ? navigateTo('/subscriptions') : null)
const subscribersHandler = () => (props.itsMe ? navigateTo('/subscribers') : null)


</script>