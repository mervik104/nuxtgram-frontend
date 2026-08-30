<template>
    <AppInput
        :model-value="value"
        @update:model-value="setValue"
        @blur="handleBlur"
        :label="label"
        :placeholder="placeholder"
        :type="type"
        :error="errorMessage"
        :is-success="isSuccess"
        :is-textarea="isTextarea"
        :autofocus="autofocus"
        :maxlength="maxlength"
        :input-class="inputClass" 
    >
        <template #hint>
            <slot name="hint" />
        </template>
    </AppInput>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'
import AppInput from './AppInput.vue'

const props = withDefaults(defineProps<{
    name: string
    label?: string
    type?: string
    placeholder?: string
    isSuccess?: boolean
    isTextarea?: boolean
    maxlength?: number
    inputClass?: string
    autofocus?: boolean
}>(), {
    type: 'text'
})

const { value, errorMessage, handleBlur, setValue } = useField<string>(() => props.name)
</script>