import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { deleteNotification, findNotifications, markNotificationRead } from '~/data/surreal/notifications'
import { useSurrealDb } from '~/data/surreal/useSurrealDb'
import { useAuthStore } from './auth'
import type { INotification } from '~/types/notification.types'

export const useNotificationsStore = defineStore('notificationsStore', () => {
  const authStore = useAuthStore()
  const items = ref<INotification[]>([])
  const isLoading = ref(false)
  const unreadCount = computed(() => items.value.filter((item) => item.unread).length)

  async function fetchNotifications(showToast = false) {
    const userId = authStore.user?.id
    if (!userId) { items.value = []; return }
    isLoading.value = true
    try {
      const previousIds = new Set(items.value.map((item) => item.id))
      const nextItems = await findNotifications(await useSurrealDb().connect(), userId)
      if (showToast) {
        const toast = useToast()
        nextItems.filter((item) => !previousIds.has(item.id)).reverse().forEach((item) => {
          toast.add({
            title: item.actor.username,
            description: notificationText(item.type),
            color: 'primary',
            duration: 4500,
            actions: [{ label: 'Открыть', onClick: () => void openNotification(item) }],
          })
        })
      }
      items.value = nextItems
    }
    finally { isLoading.value = false }
  }

  async function markRead(id: string) {
    const item = items.value.find((notification) => notification.id === id)
    if (!item?.unread) return
    item.unread = false
    try { await markNotificationRead(await useSurrealDb().connect(), id) }
    catch { item.unread = true }
  }

  async function markAllRead() {
    const unread = items.value.filter((item) => item.unread)
    unread.forEach((item) => { item.unread = false })
    try {
      const db = await useSurrealDb().connect()
      await Promise.all(unread.map((item) => markNotificationRead(db, item.id)))
    } catch { unread.forEach((item) => { item.unread = true }) }
  }

  async function clearAll() {
    const previous = items.value
    items.value = []
    try {
      const db = await useSurrealDb().connect()
      await Promise.all(previous.map((item) => deleteNotification(db, item.id)))
    } catch { items.value = previous }
  }

  async function openNotification(item: INotification) {
    await markRead(item.id)
    if (item.type === 'follow') {
      await navigateTo('/subscribers')
      return
    }
    window.location.hash = `#/feed/${encodeURIComponent(item.postId ?? item.entityId)}`
  }

  function add(item: INotification) {
    if (!items.value.some((notification) => notification.id === item.id)) items.value.unshift(item)
  }

  function clear() { items.value = [] }
  watch(() => authStore.user?.id, (userId) => {
    if (userId) void fetchNotifications()
    else clear()
  }, { immediate: true })

  return { items, isLoading, unreadCount, fetchNotifications, markRead, markAllRead, clearAll, openNotification, add, clear }
})

function notificationText(type: INotification['type']) {
  return ({
    reaction: 'поставил(а) реакцию на вашу публикацию',
    follow: 'подписался(ась) на вас',
    comment: 'оставил(а) комментарий',
    mention: 'упомянул(а) вас',
    message: 'написал(а) вам',
  })[type]
}
