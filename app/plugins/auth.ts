import { useAuthStore } from "~/stores/auth"

export default defineNuxtPlugin(async () => {
    const auth = useAuthStore()

    try {
        await auth.getMe()
    } catch(er) {

    }
})