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
      <span class="text-icon-primary font-medium">
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/profile/${user.nickname}`" :class="styles.name()">
            {{ user.username }}
          </NuxtLink>
          <span class="text-icon-secondary text-[12px]"> • {{ date }}</span>
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
    <Avatar size="xl" class="max-sm:w-14 max-sm:h-14" :avatar="user.avatar" :alt="user.username" />
    <div class="flex flex-col flex-1 min-w-0">

      <div class="flex items-center gap-2 mb-1 max-sm:mb-0.5">
        <div class="min-w-0 flex-1">
          <h3 :class="[styles.name(), 'min-w-0 truncate']">{{ user.username }}</h3>
          <div :class="[styles.nickname(), 'mb-1 max-sm:mb-0.5 flex gap-1 min-w-0 truncate']">
            <span>@{{ user.nickname }}</span>
            <span>·</span>
            <span v-if="follows" class="truncate">{{ `${follows?.followersCount}
              ${pluralFollowers(follows?.followersCount)}` }}</span>
          </div>
          <p class="text-icon-secondary text-[12px] mb-1 min-w-0 max-sm:line-clamp-2">{{ user.bio || bioPlaceholder }}</p>
        </div>

        <div v-if="follows" class="ml-auto shrink-0 self-start" @click.stop>
          <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
            @openEditModalHandler="emit('openEditModalHandler')" />
        </div>
      </div>
    </div>
  </div>

  <UserCardSkeleton v-else-if="size === 'profile' && isLoading" />

  <div v-else-if="size === 'profile'" :class="styles.container()">
    <!-- ================= МОБИЛКА: аватар + имя в ряд, статы-числа и описание под ================= -->
    <div class="sm:hidden">
      <div class="flex items-center gap-3">
        <ProfileAvatar :user="user" :its-me="itsMe" class="shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-icon-primary leading-tight">{{ user.username }}</h1>
            <p class="text-sm text-icon-secondary font-mono">@{{ user.nickname }}</p>
          </div>
          <div v-if="follows" class="mt-2 flex gap-2">
            <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
              @openEditModalHandler="emit('openEditModalHandler')" />
          </div>
        </div>
      </div>

      <div v-if="follows" class="flex gap-6 mt-4">
        <div class="flex flex-col items-center">
          <span class="text-lg font-semibold text-icon-primary leading-none">{{ feedMeta ? feedMeta.totalDocs : 0
            }}</span>
          <span class="text-xs text-icon-secondary mt-1">посты</span>
        </div>
        <div @click="subscribersHandler" :class="itsMe ? 'cursor-pointer' : ''" class="flex flex-col items-center">
          <span class="text-lg font-semibold text-icon-primary leading-none">{{ follows?.followersCount }}</span>
          <span class="text-xs text-icon-secondary mt-1">подписчики</span>
        </div>
        <div @click="subscriptionsHandler" :class="itsMe ? 'cursor-pointer' : ''" class="flex flex-col items-center">
          <span class="text-lg font-semibold text-icon-primary leading-none">{{ follows?.followingCount }}</span>
          <span class="text-xs text-icon-secondary mt-1">подписки</span>
        </div>
      </div>

      <p class="text-sm leading-relaxed text-icon-secondary mt-3">
        {{ user.bio || bioPlaceholder }}
      </p>
    </div>

    <!-- ================= ДЕСКТОП: 2 колонки — аватар слева, вся информация справа ================= -->
    <div class="hidden sm:flex sm:items-center sm:gap-6">
      <ProfileAvatar :user="user" :its-me="itsMe" class="shrink-0" />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-bold text-icon-primary leading-tight">{{ user.username }}</h1>
          <span class="text-icon-secondary font-mono">@{{ user.nickname }}</span>
          <div v-if="follows" class="ml-auto flex gap-2">
            <UserActions :isFollowing="follows?.isFollowing || false" :itsMe="itsMe" :user="user"
              @openEditModalHandler="emit('openEditModalHandler')" />
          </div>
        </div>

        <p class="text-sm leading-relaxed text-icon-secondary mt-3">
          {{ user.bio || bioPlaceholder }}
        </p>

        <div v-if="follows" class="flex gap-4 mt-3 text-sm text-icon-secondary">
          <ProfileStatChip :stat="feedMeta ? feedMeta.totalDocs : 0">
            {{ pluralPublications(feedMeta?.totalDocs || 0) }}
          </ProfileStatChip>
          <ProfileStatChip :class="itsMe ? 'cursor-pointer hover:bg-surface-accent-hover transition-colors' : ''"
            @click="subscribersHandler" :stat="follows?.followersCount">
            {{ pluralFollowers(follows?.followersCount) }}
          </ProfileStatChip>
          <ProfileStatChip :class="itsMe ? 'cursor-pointer hover:bg-surface-accent-hover transition-colors' : ''"
            @click="subscriptionsHandler" :stat="follows?.followingCount">
            {{ pluralFollowing(follows?.followingCount) }}
          </ProfileStatChip>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFollowsStore } from '~/stores/follows'
import type { IPaginationMeta } from '~/types/common.types'
import type { IUser } from '~/types/user.types'
import { copyToClipboard } from '~/utils/clipboard';
import { tv } from 'tailwind-variants'

const userCardVariants = tv({
  slots: {
    container: '',
    wrapper: 'flex items-center gap-3',
    info: 'flex-1 min-w-0',
    name: 'font-medium text-icon-primary truncate',
    nickname: 'font-mono text-icon-secondary truncate',
  },
  variants: {
    size: {
      widget: {
        container: '',
        wrapper: 'flex items-center gap-3 px-2 py-2 cursor-pointer select-none',
        name: 'text-md',
        nickname: 'text-sm hover:text-icon-secondary active:text-icon-primary cursor-pointer',
      },
      post: {
        container: 'flex items-center justify-between',
        wrapper: 'flex items-center gap-3',
        name: 'text-md cursor-pointer hover:text-icon-primary',
        nickname: 'text-[12px]',
      },
      comment: {
        container: 'flex items-center justify-between',
        wrapper: 'flex items-center gap-3',
        name: 'text-md cursor-pointer hover:text-icon-primary',
        nickname: '',
      },
      sm: {
        container: 'flex gap-4 items-center hover:bg-surface-secondary rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-md text-center',
        nickname: '',
      },
      md: {
        container: 'flex gap-4 items-center hover:bg-surface-secondary rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-lg text-center',
        nickname: '',
      },
      lg: {
        container: 'flex gap-4 items-center hover:bg-surface-secondary rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-xl max-sm:text-sm',
        nickname: 'text-icon-secondary text-[12px] max-sm:text-[11px]',
      },
      profile: {
        container: 'flex-1 w-full min-w-0',
        wrapper: '',
        name: 'text-xl font-bold text-icon-primary',
        nickname: 'text-icon-secondary font-mono',
      },
    },
  },
})

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
const copyId = async () => {
  const toast = useNotification()
  const copied = await copyToClipboard(props.user.nickname)
  if (copied) {
    toast.success({ message: 'ID скопирован в буфер обмена' })
  }
}

</script>