import { usePresenceHeartbeat } from '~/composables/usePresenceHeartbeat'

export default defineNuxtPlugin(() => {
  usePresenceHeartbeat()
})
