<template>
  <div v-if="size === 'widget'" :class="styles.container()">
    <div :class="styles.wrapper()">
      <Avatar :avatar="user.avatar" size="md" />
      <div :class="styles.info()">
        <h4 :class="styles.name()">{{ user.username }}</h4>
        <p @click.stop="copyId" :class="styles.nickname()">
          @{{ user.nickname }}
        </p>
      </div>
    </div>
  </div>

  <div v-else-if="size === 'post' || size === 'comment'" :class="styles.container()">
    <div :class="styles.wrapper()">
      <NuxtLink :to="`/profile/${user.nickname}`">
        <Avatar class="cursor-pointer hover:brightness-90 transition" :avatar="user.avatar"
          :size="size === 'post' ? 'md' : 'sm'" />
      </NuxtLink>
      <span class="text-gray-200 font-medium">
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/profile/${user.nickname}`" :class="styles.name()">
            {{ user.username }}
          </NuxtLink>
          <span class="text-gray-500 text-[12px]"> • {{ date }}</span>
        </div>
        <p v-if="size === 'post'" :class="styles.nickname()">@{{ user.nickname }}</p>
      </span>
    </div>
  </div>

  <div v-else-if="size === 'sm' || size === 'md'" :class="styles.container()">
    <Avatar :size="size" :avatar="user.avatar" :alt="user.username" />
    <h3 :class="styles.name()">{{ user.username }}</h3>
  </div>

  <UserCardLgSkeleton v-else-if="size === 'lg' && isLoading" />

  <div v-else-if="size === 'lg'" :class="styles.container()">
    <Avatar size="xl" :avatar="user.avatar" :alt="user.username" />
    <div class="flex flex-col flex-1">
      <div class="flex items-center gap-2 mb-1">
        <h3 :class="styles.name()">{{ user.username }}</h3>
        <div v-if="follows" class="ml-auto" @click.stop>
          <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
            @openEditModalHandler="emit('openEditModalHandler')" />
        </div>
      </div>
      <div :class="[styles.nickname(), 'mb-1 flex gap-1']">
        <span>@{{ user.nickname }}</span>
        <span>·</span>
        <span v-if="follows">{{ `${follows?.followersCount} ${pluralFollowers(follows?.followersCount)}` }}</span>
      </div>
      <p class="text-gray-400 text-[12px] mb-1">{{ user.bio || bioPlaceholder }}</p>
    </div>
  </div>

  <UserCardSkeleton v-else-if="size === 'profile' && isLoading" />

  <div v-else-if="size === 'profile'" :class="styles.container()">
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
      <h1 :class="styles.name()">{{ user.username }}</h1>
      <span :class="styles.nickname()">@{{ user.nickname }}</span>
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
import type { IPaginationMeta } from '~/types/common.types'
import type { IUser } from '~/types/user.types'
import { userCardVariants } from '~/utils/ui/atoms';

const props = withDefaults(
  defineProps<{
    user: IUser
    size?: 'sm' | 'md' | 'lg' | 'profile' | 'comment' | 'post' | 'widget'
    feedMeta?: IPaginationMeta | null
    itsMe?: boolean
    date?: string
  }>(),
  {
    size: 'sm',
    feedMeta: null,
    itsMe: false,
    date: 'Дата не указана',
  }
)
const emit = defineEmits<{
  (e: 'openEditModalHandler'): void
}>()

const followsStore = useFollowsStore()
const bioPlaceholder = 'Описания пока нет...'
const isLoading = ref(['lg', 'profile'].includes(props.size))
const styles = computed(() => userCardVariants({ size: props.size }))
const follows = computed(() =>
  ['lg', 'profile'].includes(props.size) ? followsStore.follows[props.user.id] : null
)

onMounted(async () => {
  if (['lg', 'profile'].includes(props.size)) {
    await followsStore.getFollows(props.user.id)
    isLoading.value = false
  }
})

const subscriptionsHandler = () => (props.itsMe ? navigateTo('/subscriptions') : null)
const subscribersHandler = () => (props.itsMe ? navigateTo('/subscribers') : null)
const copyId = () => {
  const toast = useNotification()
  navigator.clipboard.writeText(props.user.nickname)
  toast.success({ message: 'ID скопирован в буфер обмена' })
}

</script>