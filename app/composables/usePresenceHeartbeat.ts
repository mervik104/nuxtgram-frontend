import { authBridge } from '~/utils/authBridge'
import { useAuthStore } from '~/stores/auth'

const HEARTBEAT_INTERVAL = 3_000

export function usePresenceHeartbeat() {
  let timer: ReturnType<typeof setInterval> | undefined
  let requestInFlight = false
  const authStore = useAuthStore()

  async function beat() {
    const bridge = authBridge.value
    if (requestInFlight || !bridge?.isLoaded.value || !bridge.isSignedIn.value) return
    requestInFlight = true
    try {
      const response = await bridge.requestWorker<{ last_seen_at?: string }>('/presence/heartbeat', { method: 'POST' })
      if (response.last_seen_at && authStore.user) authStore.user.lastSeenAt = response.last_seen_at
    } catch (error) {
      console.warn('[presence] heartbeat failed', error)
    } finally {
      requestInFlight = false
    }
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  function start() {
    stop()
    void beat()
    timer = setInterval(() => void beat(), HEARTBEAT_INTERVAL)
  }

  watch(
    [() => authBridge.value?.isLoaded.value, () => authBridge.value?.isSignedIn.value],
    ([loaded, signedIn]) => (loaded && signedIn ? start() : stop()),
    { immediate: true },
  )

  // This composable is mounted by a client plugin, not by a component, so
  // component lifecycle hooks would never start the heartbeat.
  if (import.meta.hot) import.meta.hot.dispose(stop)
}
