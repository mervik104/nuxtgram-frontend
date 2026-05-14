<template>
    <BaseModal v-model="isOpen">
        <div class="flex flex-col items-center p-6 w-100px mx-auto rounded-2xl">
            <h3 class="text-2xl font-bold text-gray-200 mb-6">Настройки профиля</h3>

            <div class="w-full space-y-4">
                <VeeInput name="username" label="Имя" placeholder="Введите имя" />
                <VeeInput name="nickname" label="Никнейм" placeholder="Введите никнейм" :is-success="isNicknameSuccess">
                    <template #hint>
                        <p v-if="isCheckingNickname" class="text-blue-400 text-xs">Проверка доступности...</p>
                        <p v-else-if="isNicknameSuccess" class="text-green-500 text-xs">Это имя доступно</p>
                    </template>
                </VeeInput>
                <VeeInput name="biography" 
                fill="subtle"
                label="Краткое описание" 
                placeholder="Краткое описание" 
                is-textarea
                :maxlength="200" input-class="h-[200px]" />
            </div>

            <div class="flex w-full mt-8 gap-3">
                <BaseButton @click="isOpen = false" variant="secondary" class="flex-1">
                    Отмена
                </BaseButton>

                <BaseButton @click="saveProfile" loader-variant="white" variant="primary" :loading="isSaving" :disabled="isSaveDisabled" class="flex-1">
                    Сохранить
                </BaseButton>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { editProfileSchema } from '~/schemas/auth'
import { useAuthStore } from '~/stores/auth'
import { useNicknameCheck } from '~/composables/useNicknameCheck'
import VeeInput from '~/components/ui/VeeInput.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const isOpen = defineModel<boolean>({ required: true })
const isSaving = ref(false)

const { handleSubmit, setFieldError, resetForm, meta } = useForm({
    validationSchema: toTypedSchema(editProfileSchema),
    initialValues: {
        username: '',
        nickname: '',
        biography: ''
    }
})

const { value: nicknameVal } = useField<string>('nickname')

const { isAvailable: nicknameAvailable, isChecking: isCheckingNickname } = useNicknameCheck(
    nicknameVal,
    computed(() => user.value?.nickname),
    setFieldError
)

const isNicknameSuccess = computed(() =>
    nicknameAvailable.value === true && nicknameVal.value !== user.value?.nickname
)

watch(isOpen, (val) => {
    if (val && user.value) {
        resetForm({
            values: {
                username: user.value.username || '',
                nickname: user.value.nickname || '',
                biography: user.value.bio || ''
            }
        })
    }
}, { immediate: true })

const isSaveDisabled = computed(() => {
    if (isSaving.value || isCheckingNickname.value || !meta.value.valid) return true
    if (nicknameVal.value !== user.value?.nickname && nicknameAvailable.value !== true) return true
    return false
})

const saveProfile = handleSubmit(async (values) => {
    isSaving.value = true
    try {
        await authStore.editProfile({
            username: values.username,
            nickname: values.nickname,
            bio: values.biography
        })
        isOpen.value = false
    } catch (error: any) {
        const errors = error.response?._data?.errors

        if (errors && errors.length > 0) {
            errors.forEach((e: any) => {
                const field = ['username', 'nickname', 'biography'].includes(e.path) ? e.path : 'username'
                setFieldError(field, e.message)
            })
        } else {
            setFieldError('username', 'Ошибка сохранения')
        }
    } finally {
        isSaving.value = false
    }
})

</script>