import { defineStore } from "pinia"
import type { IUser, IUserEditProfileType } from "../types/user.types"
import { ref } from "vue";
import { useSurrealDb } from "../data/surreal/useSurrealDb";
import { toAvatar, toUser } from "~/data/surreal/mappers";
import { log, logError } from "~/utils/logger";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Стор авторизации/профиля: текущий юзер, загрузка профиля, вход/выход,
// редактирование профиля и аватара. Ходит в clerkAuth (authBridge) + SurrealDB.
export const useAuthStore = defineStore('authStore', () => {
    const user = ref<IUser | null>(null)

    const isProcess = ref<boolean>(false)

    const isEditProfileModalOpen = ref(false)

    function openEditProfileModal() {
        isEditProfileModalOpen.value = true
    }

    // Полный сброс юзера (логаут / «профиль не создан»).
    function clearUser() {
        user.value = null
    }

    // Загрузка профиля по clerkId из Clerk-моста.
    // Ждёт загрузки Clerk (до 3с), сбрасывает user, если не авторизован;
    // при отсутствии профиля в БД — пытается создать через provision и
    // перезапрашивает. Ошибки сети НЕ трогают текущего user'а.
    async function getMe() {
        const bridge = authBridge.value
        if (!bridge) {
            log('auth', 'getMe: мост (bridge) ещё не готов')
            return user
        }

        if (!bridge.isLoaded.value) {
            for (let attempt = 0; attempt < 15; attempt++) {
                await sleep(200)
                if (bridge.isLoaded.value) break
            }
            if (!bridge.isLoaded.value) {
                log('auth', 'getMe: Clerk так и не загрузился (3с)')
                return user
            }
        }

        if (!bridge.isSignedIn.value || !bridge.userId.value) {
            log('auth', 'getMe: не авторизован, сбрасываю user', {
                isSignedIn: bridge.isSignedIn.value,
                userId: bridge.userId.value,
            })
            clearUser()
            return user
        }

        try {
            const { getUserByClerkId } = useSurrealDb()
            let currentUser = await getUserByClerkId(bridge.userId.value)

            if (!currentUser) {
                const candidate = bridge.clientUsername.value
                if (candidate) {
                    log('auth', 'getMe: профиль не найден, создаю через provision', { username: candidate })
                    await bridge.provision(candidate)
                    currentUser = await useSurrealDb().getUserByClerkId(bridge.userId.value)
                }
            }

            if (!currentUser) {
                log('auth', 'getMe: профиль так и не создан', { clerkId: bridge.userId.value })
                clearUser()
                return user
            }

            user.value = toUser(currentUser)
            log('auth', 'getMe: профиль загружен', { username: user.value.username, id: String(currentUser.id) })
        } catch (error) {
            logError('auth', 'getMe: запрос профиля упал (текущий user сохранён)', error)
        }

        return user
    }

    // Выход через Clerk-мост + сброс юзера и редирект на вход.
    async function logout() {
        isProcess.value = true
        try {
            if (authBridge.value?.isLoaded.value) await authBridge.value.signOut()
            clearUser()
            redirectToLogin()
        } finally {
            isProcess.value = false
        }
    }

    // Профиль по никнейму (для страницы профиля по ссылке) или null.
    async function getUserByNickname(nick: string) {
        if (!authBridge.value?.isLoaded.value) return null

        const { getUserByNickname: findUserByNickname } = useSurrealDb()
        const currentUser = await findUserByNickname(nick)
        return currentUser ? toUser(currentUser) : null
    }

    // Доступность никнейма (для live-валидации форм).
    async function checkNicknameAvailable(nick: string) {
        if (!authBridge.value?.isLoaded.value) return false

        const { isNicknameAvailable } = useSurrealDb()
        return await isNicknameAvailable(nick)
    }

    // Обновляет профиль (username/nickname/bio). Если сменили никнейм — 
    // редиректим на новый URL профиля.
    async function editProfile(data: IUserEditProfileType) {
        isProcess.value = true
        try {
            const bridge = authBridge.value
            if (bridge?.isLoaded.value && bridge.userId.value) {
                const { updateUserByClerkId } = useSurrealDb()
                const updatedUser = await updateUserByClerkId(bridge.userId.value, data)
                if (!updatedUser) throw new Error('Профиль не найден')

                const nextUser = toUser(updatedUser)
                if (user.value && user.value.nickname !== nextUser.nickname) {
                    redirectToProfile(nextUser.nickname)
                }
                user.value = nextUser
                return
            }
            throw new Error('Сессия Clerk недоступна')
        } finally {
            isProcess.value = false
        }
    }

    // Загрузка аватара: файл → worker /media/upload → /media/complete-avatar,
    // затем профиль перечитывается getMe().
    async function uploadAvatar(formData: FormData) {
        isProcess.value = true
        try {
            const bridge = authBridge.value
            if (!bridge) throw new Error('Сессия Clerk недоступна')

            const file = formData.get('avatar')
            if (!(file instanceof File)) throw new Error('File is required')

            const upload = await bridge.uploadImage(file.name, file.type, file)

            await bridge.requestWorker('/media/complete-avatar', {
                method: 'POST',
                body: { objectKey: upload.objectKey, filename: file.name, alt: `Avatar for ${user.value?.username || 'user'}` },
            })

            await getMe()
        }
        finally {
            isProcess.value = false
        }
    }

    // Удаляет аватар через worker /media/delete-avatar, затем getMe().
    async function deleteAvatar() {
        isProcess.value = true
        try {
            const bridge = authBridge.value
            if (!bridge) throw new Error('Сессия Clerk недоступна')

            await bridge.requestWorker('/media/delete-avatar', { method: 'POST' })
            await getMe()
        }
        finally {
            isProcess.value = false
        }

    }

    return {
        getMe,
        logout,
        user,
        isProcess,
        getUserByNickname,
        uploadAvatar,
        deleteAvatar,
        isEditProfileModalOpen,
        openEditProfileModal,
        clearUser,
        checkNicknameAvailable,
        editProfile
    }
}
)
