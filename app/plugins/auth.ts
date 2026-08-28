import { useAuthStore } from "~/stores/auth"
import type { AuthBridge } from "~/utils/authBridge"
import { resetAppState } from "~/utils/resetState"
import { log, logError } from "~/utils/logger"

// Плагин-синхронизатор Clerk ↔ Vue: следит за authBridge (isLoaded/isSignedIn/
// userId). При смене идентичности (войти/выйти/другой юзер) сбрасывает состояние
// приложения (resetAppState) и перечитывает профиль (getMe).
export default defineNuxtPlugin(() => {
    const auth = useAuthStore()

    let lastSignedIn = false
    let lastUserId: string | null = null

    // Перечитывает профиль из БД; при провале загрузки — сбрасывает юзера,
    // чтобы UI не показывал протухшие данные.
    const sync = async (bridge: AuthBridge) => {
        log('auth', 'sync: начинаю getMe', { isLoaded: bridge.isLoaded.value, isSignedIn: bridge.isSignedIn.value })
        try {
            await auth.getMe()
            log('auth', 'sync: getMe успешен', { userId: auth.user?.id ?? null })
        } catch (error) {
            logError('auth', 'sync: getMe упал', error)
            auth.clearUser()
        }
    }

    // Наблюдаем за мостом; внутри него — за тройкой isLoaded/isSignedIn/userId.
    // Глобальный watch: при реальной смене сессии делаем resetAppState.
    watch(authBridge, (bridge) => {
        if (!bridge) return

        watch([bridge.isLoaded, bridge.isSignedIn, bridge.userId], async ([isLoaded, signedIn, userId]) => {
            if (!isLoaded) {
                log('auth', 'Clerk ещё не загружен, пропускаю sync')
                return
            }

            const identityChanged = signedIn !== lastSignedIn || (signedIn && userId !== lastUserId)
            if (identityChanged) {
                lastSignedIn = signedIn
                lastUserId = userId
                log('auth', 'идентичность изменилась, сбрасываю состояние', { signedIn, userId })
                await resetAppState()
            }

            log('auth', 'состояние Clerk изменилось', { isLoaded, signedIn, userId })
            await sync(bridge)
        }, { immediate: true })
    }, { immediate: true })
})