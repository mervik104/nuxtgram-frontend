<template>
  <AuthCard title="Регистрация в NuxtGram" width="fixed">
    <template #form-fields>
      <div v-if="!verificationRequired" class="grid grid-cols-1 grid-rows-1 gap-4 gap-y-3 text-lg">
        <VeeInput :autofocus="true"  name="username" type="text" placeholder="Имя" />
        <VeeInput name="email" type="email" placeholder="Электронная почта" />
        <VeeInput name="password" type="password" placeholder="Пароль" />
        <VeeInput name="verify-password" type="password" placeholder="Повторите пароль" />
      </div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-center text-sm text-gray-400">{{ verified ? 'Создаю профиль...' : 'Введите код из письма для подтверждения email' }}</p>
        <AppInput v-if="!verified" v-model="verificationCode" autofocus placeholder="Код подтверждения" :error="verificationError" />
        <p v-else-if="verificationError" class="text-sm text-center text-red-500">{{ verificationError }}</p>
      </div>
    </template>

    <template #buttons>
      <AppButton v-if="!verificationRequired" @click="handleSubmitAction" :disabled="isError" :loading="isProcess" variant="primary" size="xl"
        rounded="md" class="w-full mt-2">
        Зарегистрироваться
      </AppButton>
      <template v-else>
        <AppButton @click="verifyHandler" :disabled="!verified && !verificationCode" :loading="isVerifying" variant="primary" size="xl"
          rounded="md" class="w-full mt-2">
          {{ verified ? 'Продолжить' : 'Подтвердить email' }}
        </AppButton>
        <AppButton v-if="!verified" @click="resendHandler" :disabled="isVerifying" variant="text" class="w-full">
          Отправить код повторно
        </AppButton>
      </template>
    </template>
  </AuthCard>
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

const { handleSubmitAction, isError, isProcess } = useAuthForm(registerSchema, registerHandler)

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return
    if (verificationRequired.value) verifyHandler()
    else handleSubmitAction()
})
</script>
