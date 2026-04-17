import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { useAuthStore } from "~/stores/auth"

export const useAuthForm = (schema: any, action: Function) => {
    const authStore = useAuthStore()
    const { getMe } = authStore
    const { isProcess } = storeToRefs(authStore)

    const { handleSubmit, setFieldError, errors } = useForm({
        validationSchema: toTypedSchema(schema)
    })

    const isError = computed(() => {
        return !!errors.value.email || !!errors.value.password
    })

    const handleSubmitAction = handleSubmit(async (values) => {
        try {
            await action(values)
            await getMe()
            navigateTo('/posts')
        } catch (error: any) {
            const errors = error.response?._data?.errors
            const errorMessage = errors && errors.length > 0
                ? errors.map((e: any) => e.message).join('\n')
                : 'Неизвестная ошибка'

            setFieldError('email', errorMessage)
            if (errors?.some((e: any) => e.field === 'username')) {
                setFieldError('username', errorMessage)
            }
        }
    })

    return {
        handleSubmitAction,
        setFieldError,
        errors,
        isError,
        isProcess
    }
}