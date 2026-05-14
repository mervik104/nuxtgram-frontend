<template>
  <AuthCard title="Регистрация в NuxtGram" width="fixed">
    <template #form-fields>
      <div class="grid grid-cols-1 grid-rows-1 gap-4 gap-y-3 text-lg">
        <VeeInput :autofocus="true"  name="username" type="text" placeholder="Имя" />
        <VeeInput name="email" type="email" placeholder="Электронная почта" />
        <VeeInput name="password" type="password" placeholder="Пароль" />
        <VeeInput name="verify-password" type="password" placeholder="Повторите пароль" />
      </div>
    </template>

    <template #buttons>
      <AppButton @click="handleSubmitAction" :disabled="isError" :loading="isProcess" variant="primary" size="xl"
        rounded="md" class="w-full mt-2">
        Зарегистрироваться
      </AppButton>
    </template>
  </AuthCard>
</template>

<script lang="ts" setup>
import { registerSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { register } = authStore

const registerHandler = (values: any) => {
  return register({
    username: values.username,
    email: values.email,
    password: values.password,
  })
}

const { handleSubmitAction, isError, isProcess } = useAuthForm(registerSchema, registerHandler)

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSubmitAction()
    }
})
</script>