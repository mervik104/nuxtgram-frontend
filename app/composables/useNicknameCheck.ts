import { ref, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'
import { isReservedNickname, normalizeNickname } from '~/utils/nickname'

// Live-проверка уникальности никнейма на форме профиля/регистрации.
//
// Следит за полем nicknameVal, дебаунсит ввод (200ms) и запрашивает
// у authStore доступность ника; при занятости сразу вешает ошибку поля.
// Возвращает refs: isAvailable (bool | null, пока не проверили) и isChecking.
export function useNicknameCheck(
    nicknameVal: Ref<string>,
    originalNickname: Ref<string | undefined>,
    setFieldError: (field: "username" | "nickname" | "biography", message: string | string[] | undefined) => void
) {
    const authStore = useAuthStore()

    const isAvailable = ref<boolean | null>(null)
    const isChecking = ref(false)
    let requestId = 0

    const checkNicknameDebounced = useDebounceFn(async (nick: string) => {
        const currentRequest = ++requestId
        const canonical = normalizeNickname(nick)
        if (isReservedNickname(canonical)) {
            isAvailable.value = false
            setFieldError('nickname', 'Это имя зарезервировано')
            isChecking.value = false
            return
        }
        try {
            isChecking.value = true
            const available = await authStore.checkNicknameAvailable(canonical)
            if (currentRequest !== requestId) return
            isAvailable.value = available

            if (!available) {
                setFieldError('nickname', 'Это имя занято')
            } else {
                setFieldError('nickname', undefined)
            }
        } catch (error) {
            console.error('Ошибка проверки ника', error)
        } finally {
            if (currentRequest === requestId) isChecking.value = false
        }
    }, 200)

    watch(nicknameVal, (newNick) => {
        const canonical = normalizeNickname(newNick)
        if (newNick !== canonical) {
            nicknameVal.value = canonical
            return
        }
        isAvailable.value = null
        requestId++
        if (!canonical || canonical === normalizeNickname(originalNickname.value ?? '')) {
            isChecking.value = false
            return
        }
        if (canonical.length < 3 || canonical.length > 30) return

        checkNicknameDebounced(canonical)
    })

    return { isAvailable, isChecking }
}
