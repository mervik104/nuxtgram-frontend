<template>
    <AuthShell>
        <template #brand>
            <AuthBrand size="lg">
                <p class="text-base sm:text-lg text-icon-secondary leading-relaxed max-w-sm">
                    Создайте аккаунт — это займёт меньше минуты.
                </p>
            </AuthBrand>
        </template>

        <template #mobile-brand>
            <AuthBrand size="sm" />
        </template>

        <AuthCard title="Регистрация">
            <template #subtitle>
                <p class="text-sm text-icon-secondary text-center">Создайте аккаунт</p>
            </template>

            <template #social>
                <AuthDivider />
                <SocialAuthButtons mode="sign-up" />
            </template>

            <template #form-fields>
                <div v-if="!verificationRequired" class="flex flex-col gap-2">
                    <VeeInput :autofocus="true" name="username" type="text" placeholder="Имя" />
                    <VeeInput name="email" type="email" placeholder="Электронная почта" />
                    <VeeInput name="password" type="password" placeholder="Пароль" />
                    <VeeInput name="verify-password" type="password" placeholder="Повторите пароль" />
                </div>
                <div v-else class="flex flex-col gap-3">
                    <p class="text-center text-sm text-icon-secondary">{{ verified ? 'Создаю профиль...' : 'Введите код из письма для подтверждения email' }}</p>
                    <AppInput v-if="!verified" v-model="verificationCode" autofocus placeholder="Код подтверждения" :error="verificationError" class="w-full" />
                    <p v-else-if="verificationError" class="text-sm text-center text-red-500">{{ verificationError }}</p>
                </div>
            </template>

            <template #buttons>
                <AppButton v-if="!verificationRequired" @click="handleSubmitAction" :disabled="isError" :loading="isProcess" variant="success" size="lg" rounded="md" class="w-full">
                    Зарегистрироваться
                </AppButton>
                <template v-else>
                    <AppButton @click="verifyHandler" :disabled="!verified && !verificationCode" :loading="isVerifying" variant="primary" size="lg"
                        rounded="md" class="w-full mt-2">
                        {{ verified ? 'Продолжить' : 'Подтвердить email' }}
                    </AppButton>
                    <AppButton v-if="!verified" @click="resendHandler" :disabled="isVerifying" variant="text" class="text-icon-secondary hover:text-icon-primary w-full">
                        Отправить код повторно
                    </AppButton>
                </template>
            </template>
        </AuthCard>

        <div class="flex items-center justify-center">
            <button type="button" class="text-blue-600 hover:underline text-sm sm:text-base font-medium"
                @click="redirectToLogin">
                Уже есть аккаунт? Войти
            </button>
        </div>
    </AuthShell>
</template>

<script lang="ts" setup>
import { registerSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { provision } = useClerkAuth()
const { startSignUp, verifySignUp, resendSignUpCode } = useClerkAuthFlow()
const verificationRequired = ref(false)
const verificationCode = ref('')
const verificationError = ref<string | undefined>()
const pendingUsername = ref('')
const isVerifying = ref(false)
const verified = ref(false)

const registerHandler = async (values: { username: string; email: string; password: string }) => {
  pendingUsername.value = values.username
  const isComplete = await startSignUp(values.email, values.password)

  if (!isComplete) {
    verificationRequired.value = true
    return false
  }

  await provision(values.username)
}

const verifyHandler = async () => {
  verificationError.value = undefined
  isVerifying.value = true

  try {
    if (!verified.value) {
      await verifySignUp(verificationCode.value)
      verified.value = true
    }
    await provision(pendingUsername.value)
    await authStore.getMe()
    await navigateTo('/feed')
  } catch (error: any) {
    verificationError.value = error.message || 'Не удалось подтвердить код'
  } finally {
    isVerifying.value = false
  }
}

const resendHandler = async () => {
  if (verified.value) return
  verificationError.value = undefined
  try {
    await resendSignUpCode()
  } catch (error: any) {
    verificationError.value = error.message || 'Не удалось отправить код'
  }
}

function redirectToLogin() {
    navigateTo('/login')
}

const { handleSubmitAction, isError, isProcess } = useAuthForm(registerSchema, registerHandler)

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return
    if (verificationRequired.value) verifyHandler()
    else handleSubmitAction()
})
</script>