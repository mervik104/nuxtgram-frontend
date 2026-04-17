<template>
    <div class="absolute bg-[#0f1416] right-0 bottom-0 left-0 top-0 content-center">
        <div class="w-max p-8 mx-auto flex flex-col bg-[#171A1C] rounded-xl justify-center gap-6">

            <div class="flex flex-col items-center">
                <img src="/logo.svg" class="w-[200px] h-auto" alt="">
                <h1 class="text-center text-3xl font-medium text-gray-200">Вход в NuxtGram</h1>
            </div>

            <div class="flex justify-center">
                <div class="flex justify-center w-72 align-center mb-auto gap-3 flex-col">
                    <VeeInput name="email" type="email" placeholder="Электронная почта" />
                    <VeeInput name="password" type="password" placeholder="Пароль" />

                    <button @click="loginHandler()"
                        class="outline-none disabled:bg-green-950 w-full text-xl mt-3 text-white rounded-md p-2 py-1.5 bg-green-600 hover:bg-green-800 transition-colors">
                        Войти
                    </button>

                    <span class="text-center text-md text-gray-600 font-semibold uppercase">или</span>

                    <button @click="redirectToRegister()"
                        class="outline-none disabled:bg-blue-950 w-full text-xl text-white rounded-md p-2 py-1.5 bg-blue-600 hover:bg-blue-800 transition-colors">
                        Регистрация
                    </button>

                    <span @click="redirectToFeed()"
                        class="text-center text-gray-700 hover:text-gray-600 hover:underline cursor-pointer">Продолжить
                        без входа</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'

const { login, getMe } = useAuthStore()

const { handleSubmit, setFieldError } = useForm({
    validationSchema: toTypedSchema(loginSchema)
})

const loginHandler = handleSubmit(async (values) => {
    try {
        await login(values)
        await getMe()
        redirectToFeed()
    } catch (error: any) {
        const errors = error.response?._data?.errors
        const errorMessage = errors && errors.length > 0
            ? errors.map((e: any) => e.message).join('\n')
            : 'Неизвестная ошибка'
        setFieldError('email', errorMessage)
        setFieldError('password', errorMessage)
    }
})
</script>