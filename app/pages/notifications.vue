<template>
  <main class="mx-auto w-full max-w-2xl px-3 py-4 sm:px-5">
    <div class="mb-4 flex items-center gap-3">
      <NuxtLink to="/profile" class="flex size-9 items-center justify-center rounded-full hover:bg-surface-secondary" aria-label="Назад">
        <AppIcon name="left" class="size-5" />
      </NuxtLink>
      <h1 class="text-xl font-bold text-icon-primary">Уведомления</h1>
      <div class="ml-auto flex gap-2 text-xs">
        <button type="button" class="notification-text-action" @click="notifications.markAllRead">Прочитать все</button>
        <button type="button" class="notification-text-action" @click="notifications.clearAll">Очистить все</button>
      </div>
    </div>

    <div v-if="notifications.isLoading" class="py-8 text-center text-icon-secondary">Загрузка...</div>
    <div v-else-if="!notifications.items.length" class="rounded-2xl bg-surface-secondary px-4 py-10 text-center text-icon-secondary">
      Пока нет уведомлений
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-border-subtle">
      <button
        v-for="item in notifications.items"
        :key="item.id"
        class="flex w-full items-start gap-2 border-b border-border-subtle px-4 py-3 text-left text-sm text-icon-secondary last:border-0"
        :class="{ 'bg-surface-secondary': item.unread }"
        type="button"
        @click="notifications.openNotification(item)"
      >
        <span class="min-w-0 flex-1">
          <strong class="text-icon-primary">{{ item.actor.username }}</strong>
          {{ notificationText(item.type) }}
          <small class="mt-1 block text-xs">{{ formatSocialDate(item.createdAt) }}</small>
        </span>
        <span v-if="item.unread" class="mt-1 size-2 shrink-0 rounded-full bg-icon-accent" />
      </button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '~/stores/notifications';
import type { INotification } from '~/types/notification.types'

const notifications = useNotificationsStore()
onMounted(() => void notifications.fetchNotifications())

function notificationText(type: INotification['type']) {
  return ({ reaction: 'поставил(а) реакцию', follow: 'подписался(ась) на вас', comment: 'оставил(а) комментарий', mention: 'упомянул(а) вас', message: 'написал(а) вам' })[type]
}
</script>

<style scoped>
.notification-text-action {
  padding: 0;
  border: 0;
  color: var(--icon-accent);
  background: transparent;
  font-size: 12px;
  font-weight: 500;
}

.notification-text-action:hover { text-decoration: underline; }
</style>
