<template>
    <AuthCard title="Вход в NuxtGram" width="auto">
        <template #form-fields>
            <template v-if="!codeStep">
                <VeeInput :autofocus="true" name="email" type="email" placeholder="Электронная почта" />
                <VeeInput name="password" type="password" placeholder="Пароль" />
            </template>

            <template v-else>
                <p class="text-sm text-gray-400 mb-2">
                    Мы отправили код подтверждения. Введите его ниже (проверьте почту и SMS).
                </p>
                <AppInput v-model="codeInput" autofocus placeholder="Код подтверждения" :error="codeError" />
                <p v-if="codeSendMessage" class="text-sm text-center text-gray-500 mt-1">{{ codeSendMessage }}</p>
            </template>
        </template>

        <template #buttons>
            <template v-if="!codeStep">
                <AppButton @click="handleSubmitAction" :disabled="isError" :loading="isProcess" loader-variant="white"
                    variant="success" size="xl" rounded="md" class="w-full mt-3">Войти</AppButton>
            </template>

            <template v-else>
                <AppButton @click="submitCode" :disabled="isCodeError" :loading="isCodeSending" loader-variant="white"
                    variant="success" size="xl" rounded="md" class="w-full mt-3">Подтвердить</AppButton>
                <AppButton @click="resendCode" variant="text" size="xl" rounded="md"
                    class="w-full mt-2 text-gray-400 hover:text-gray-600">Отправить код ещё раз</AppButton>
                <AppButton @click="cancelCodeStep" variant="text" class="text-gray-600 hover:underline w-full">
                    Назад
                </AppButton>
            </template>

            <span v-if="!codeStep" class="text-center text-md text-gray-600 font-semibold uppercase">или</span>

            <AppButton v-if="!codeStep" @click="redirectToRegister" variant="primary" size="xl" rounded="md"
                class="w-full">Регистрация</AppButton>
            <AppButton v-if="!codeStep" @click="redirectToFeed" variant="text"
                class="text-gray-700 hover:text-gray-600 hover:underline">
                Продолжить без входа
            </AppButton>
        </template>
    </AuthCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { loginSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'
import { AdditionalVerificationRequired, type VerificationStrategy } from '~/composables/useClerkAuthFlow'

const { signInWithPassword, resendSignInCode, verifySignInCode } = useClerkAuthFlow()

const authStore = useAuthStore()

const codeStep = ref(false)
const codeStrategy = ref<VerificationStrategy>('email_code')
const isCodeSending = ref(false)
const isCodeError = ref(false)
const codeInput = ref('')
const codeSendMessage = ref('')
const codeError = ref('')

const loginHandler = async (values: { email: string; password: string }) => {
    try {
        return await signInWithPassword(values.email, values.password)
    } catch (error) {
        if (error instanceof AdditionalVerificationRequired) {
            codeStep.value = true
            codeStrategy.value = error.strategy
            codeSendMessage.value = `Код отправлен (${error.strategy === 'email_code' ? 'email' : error.strategy === 'phone_code' ? 'SMS' : 'приложение/бэкап'}). Проверьте устройство.`
            return false
        }
        throw error
    }
}

const { handleSubmitAction, isError, isProcess, setFieldError } = useAuthForm(loginSchema, loginHandler)

const submitCode = async () => {
    const code = codeInput.value?.trim()
    if (!code) {
        isCodeError.value = true
        codeError.value = 'Введите код из письма или SMS'
        return
    }

    isCodeSending.value = true
    isCodeError.value = false
    codeError.value = ''
    try {
        await verifySignInCode(code, codeStrategy.value)
        await authStore.getMe()
        await navigateTo('/feed')
    } catch (error: unknown) {
        isCodeError.value = true
        codeError.value = error instanceof Error ? error.message : 'Код не принят'
        codeSendMessage.value = ''
    } finally {
        isCodeSending.value = false
    }
}

const resendCode = async () => {
    codeSendMessage.value = 'Код отправлен заново.'
    await resendSignInCode(codeStrategy.value)
}

const cancelCodeStep = () => {
    codeStep.value = false
    codeSendMessage.value = ''
    codeError.value = ''
    codeInput.value = ''
}

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (codeStep.value) {
            submitCode()
        } else {
            handleSubmitAction()
        }
    }
})
</script>