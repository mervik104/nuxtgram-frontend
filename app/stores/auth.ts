import { defineStore } from "pinia"
import type { IEditProfileResponse, IUser, IUserEditProfileType, IUsersResponse, UserGetMeType, UserLoginType, UserRegisterType } from "../types/UserTypes"
import { useApiFetch } from '../composables/useApiFetch';
import { ref } from "vue";
import { useApi } from "../composables/useApi";

export const useAuthStore = defineStore('authStore', () => {
    const {apiFetch} = useApiFetch()
    const {api} = useApi()
    const user = ref<IUser | null>(null)

    const isProcess = ref<boolean>()

    const isEditProfileModalOpen = ref(false)
    
    function openEditProfileModal() { 
        console.log(isEditProfileModalOpen.value)
        isEditProfileModalOpen.value = true 
    }

    async function register(body: UserRegisterType) {
        isProcess.value = true
        try {
            await apiFetch<string>('/users/register', { body, method: 'POST' })
            await api<string>('/users/login', { body:{email: body.email, password: body.password}, method: 'POST'})
            window.location.reload()
        } catch(er) {
            throw er
        } finally {
            isProcess.value = false
        }
    }

    async function login(body: UserLoginType) {
        isProcess.value = true
        try {
            await api<string>('/users/login', { body, method: 'POST'})
            window.location.reload()
        } catch(er) {
            throw er
        } finally {
            isProcess.value = false
        }
    }

    async function getMe() {
        const res = await apiFetch<UserGetMeType>('/users/me', { method: 'GET'})
        user.value = res.user
        return user
    }

    async function logout() {
        isProcess.value = true
        try {
            await apiFetch<IUser>('/users/logout', { method: 'POST'})
            user.value = null
            redirectToLogin()
        } catch(e) {
            throw e
        } finally {
            isProcess.value = false
        }
    }

    async function getUserByNickname(nick: string) {
        try {
            const {docs} = await apiFetch<IUsersResponse>(`users?where[nickname][equals]=${nick}`)
            if(docs.length === 1) {
                return docs[0]
            }
            else {
                return null
            }
        } catch(e) {
            throw e
        }
    }

    async function checkNicknameAvailable(nick: string) {
        try {
            const { available } = await apiFetch<{ available: boolean }>(`users/check-nickname?nickname=${nick}`)
            return available
        } catch (e) {
            throw e
        }
    }

    async function editProfile(data: IUserEditProfileType) {
        isProcess.value = true
        try {
            const newData = await apiFetch<IEditProfileResponse>(`users/me/profile`, {method: 'PATCH', body: data})
            if(user.value) {
                if(user.value.nickname !== newData.user.nickname) {
                    redirectToProfile(newData.user.nickname)
                }
                user.value = newData.user
            }
        } catch(e) {
            throw e
        } finally {
            isProcess.value = false
        }
    }

    async function uploadAvatar(formData: FormData) {
        isProcess.value = true
        try{
            const data = await apiFetch<IUser>(`users/me/avatar`, {
                method: 'POST',
                body: formData
            })
            if(user.value) {
                user.value.avatar = data.avatar
            }
        }
        catch(e) {
            console.log(e)
            throw e
        }
        finally {
            isProcess.value = false
        }
        
    }

    async function deleteAvatar() {
        isProcess.value = true
        try{
            const data = await apiFetch<IUser>(`users/me/avatar`, {
                method: 'DELETE'
            })
            if(user.value) {
                user.value.avatar = data.avatar
            }
            window.location.reload()
        }
        catch(e) {
            console.log(e)
            throw e
        }
        finally {
            isProcess.value = false
        }
        
    }

    return {
        register,
        login,
        getMe,
        logout,
        user,
        isProcess,
        getUserByNickname,
        uploadAvatar,
        deleteAvatar,
        isEditProfileModalOpen,
        openEditProfileModal,
        checkNicknameAvailable,
        editProfile
    }
}
)
