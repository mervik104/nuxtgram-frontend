const userRevision = ref(0)
const changedUserId = ref<string | null>(null)

export function notifyUserChanged(userId: string) {
  changedUserId.value = userId
  userRevision.value++
}

export function useUserRealtime() {
  return { userRevision, changedUserId }
}
