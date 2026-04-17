<template>
    <div class="absolute bg-[#0f1416] right-0 bottom-0 left-0 top-0 content-center">
        <div class="w-[480px] p-8 mx-auto flex flex-col bg-[#171A1C] rounded-xl justify-center gap-6">
            <div class="flex flex-col items-center">
                <img src="/logo.svg" class="w-[200px] h-auto" alt="">
                <h1 class="text-center text-4xl font-medium text-gray-200">Регистрация в NuxtGram</h1>
            </div>

            <div class="flex justify-center">
                <div class="flex justify-center align-center mb-auto gap-3 flex-col w-full">
                    <div class="grid grid-cols-1 grid-rows-1 gap-4 gap-y-3 text-lg">
                        <VeeInput name="username" type="text" placeholder="Имя" />
                        <VeeInput name="email" type="email" placeholder="Электронная почта" />
                        <VeeInput name="password" type="password" placeholder="Пароль" />
                        <VeeInput name="verify-password" type="password" placeholder="Повторите пароль" />
                    </div>
                    <button @click="registerHandler()"
                        class="outline-none mt-2 w-full text-xl text-white rounded-md p-2 py-1.5 bg-blue-600 hover:bg-blue-800 transition-colors">Зарегистрироваться</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { registerSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth';

const { register, getMe } = useAuthStore()

const { handleSubmit, setFieldError } = useForm({
  validationSchema: toTypedSchema(registerSchema)
})

const registerHandler = handleSubmit(async (values) => {
  try {
    await register({
      username: values.username,
      email: values.email,
      password: values.password,
    })
    await getMe()
    navigateTo('/posts')
  } catch (error: any) {
    const errors = error.response?._data?.errors
    const errorMessage = errors && errors.length > 0 
      ? errors.map((e: any) => e.message).join('\n') 
      : 'Неизвестная ошибка'

    setFieldError('email', errorMessage)
    setFieldError('username', errorMessage)
  }
})
</script>