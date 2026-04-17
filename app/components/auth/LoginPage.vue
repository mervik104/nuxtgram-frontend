<template>
    <AuthCard title="Вход в NuxtGram" width="auto">
        <template #form-fields>
            <VeeInput :autofocus="true" name="email" type="email" placeholder="Электронная почта" />
            <VeeInput name="password" type="password" placeholder="Пароль" />
        </template>

        <template #buttons>
            <BaseButton @click="handleSubmitAction" :disabled="isError" :loading="isProcess" loader-variant="white"
                variant="success" size="xl" rounded="md" class="w-full mt-3">Войти</BaseButton>

            <span class="text-center text-md text-gray-600 font-semibold uppercase">или</span>

            <BaseButton @click="redirectToRegister" variant="primary" size="xl" rounded="md" class="w-full">Регистрация</BaseButton>
            <BaseButton @click="redirectToFeed" variant="text"
                class="text-gray-700 hover:text-gray-600 hover:underline">
                Продолжить без входа
            </BaseButton>
        </template>
    </AuthCard>
</template>

<script lang="ts" setup>
import { loginSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { login } = authStore

const { handleSubmitAction, isError, isProcess } = useAuthForm(loginSchema, login)

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSubmitAction()
    }
})
</script>