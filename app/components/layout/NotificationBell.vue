<template>
  <div v-if="user" ref="root" class="relative">
    <button class="notification-bell" type="button" aria-label="Уведомления" @click="toggle">
      <AppIcon name="notification" class="size-5 text-icon-primary" />
      <span v-if="notifications.unreadCount" class="notification-bell__badge">
        {{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}
      </span>
    </button>

    <div v-if="isOpen" class="notification-panel">
      <div class="notification-panel__header">
        <span>Уведомления</span>
        <div class="notification-panel__actions">
          <button class="notification-action" type="button" @click="notifications.markAllRead">Прочитать все</button>
          <button class="notification-action" type="button" @click="notifications.clearAll">Очистить</button>
        </div>
      </div>
      <p v-if="!notifications.items.length" class="notification-panel__empty">Пока нет уведомлений</p>
      <button v-for="item in notifications.items" :key="item.id" class="notification-item"
        :class="{ unread: item.unread }" type="button" @click="notifications.openNotification(item)">
        <strong>{{ item.actor.username }}</strong>
        {{ message(item.type) }}
        <small>{{ formatSocialDate(item.createdAt) }}</small>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'
import type { NotificationType } from '~/types/notification.types'

const authStore = useAuthStore()
const notifications = useNotificationsStore()
const { user } = storeToRefs(authStore)
const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) void notifications.fetchNotifications()
}

function message(type: NotificationType) {
  return ({ reaction: 'поставил(а) реакцию', follow: 'подписался(ась) на вас', comment: 'оставил(а) комментарий', mention: 'упомянул(а) вас', message: 'написал(а) вам' })[type]
}

onClickOutside(root, () => (isOpen.value = false))
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.notification-bell:hover {
  background: var(--surface-secondary, #f1f2f4);
}

.notification-bell__badge {
  position: absolute;
  top: 0;
  right: -2px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 9px;
  color: white;
  background: #ef4444;
  font: 700 10px/17px system-ui, sans-serif;
}

.notification-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  width: min(360px, calc(100vw - 24px));
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 14px;
  background: var(--surface-base, white);
  box-shadow: 0 12px 35px rgb(0 0 0 / 16%);
}

.notification-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--icon-primary, #111827);
  font-weight: 700;
}

.notification-panel__actions { display: flex; gap: 8px; font-size: 11px; font-weight: 500; }
.notification-panel__actions button { padding: 5px 8px; border: 0; border-radius: 7px; color: white; background: #2563eb; font-size: 11px; font-weight: 600; cursor: pointer; }.notification-panel__actions button:hover { background: #1d4ed8; }

.notification-panel__empty {
  padding: 24px 16px;
  color: var(--icon-secondary, #6b7280);
  text-align: center;
}

.notification-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--icon-secondary, #6b7280);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.notification-item:hover,
.notification-item.unread {
  background: var(--surface-secondary, #f5f6f8);
}

.notification-item strong {
  color: var(--icon-primary, #111827);
}

.notification-item small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}
</style>
