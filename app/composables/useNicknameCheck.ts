import { ref, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'

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

    const checkNicknameDebounced = useDebounceFn(async (nick: string) => {
        try {
            isChecking.value = true
            const available = await authStore.checkNicknameAvailable(nick)
            isAvailable.value = available

            if (!available) {
                setFieldError('nickname', 'Это имя занято')
            }
        } catch (error) {
            console.error('Ошибка проверки ника', error)
        } finally {
            isChecking.value = false
        }
    }, 200)

    watch(nicknameVal, (newNick) => {
        isAvailable.value = null
        if (!newNick || newNick === originalNickname.value) return
        if (newNick.length < 3 || newNick.length > 30) return

        checkNicknameDebounced(newNick)
    })

    return { isAvailable, isChecking }
}