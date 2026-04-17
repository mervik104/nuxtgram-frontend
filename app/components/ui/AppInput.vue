<template>
    <div v-auto-animate="{ duration: 100 }">
        <div v-if="label || $slots.hint || maxlength" class="flex justify-between mb-1">
            <label class="block text-sm font-medium text-gray-200">{{ label }}</label>
            <div class="flex items-center gap-2">
                <slot name="hint" />
                <span v-if="maxlength" class="text-xs text-gray-500">
                    {{ (modelValue || '').length }}/{{ maxlength }}
                </span>
            </div>
        </div>

        <component
            :is="isTextarea ? 'textarea' : 'input'"
            :value="modelValue"
            @input="onInput"
            @blur="$emit('blur', $event)"
            :type="type"
            :autofocus="autofocus"
            :placeholder="placeholder"
            :class="[input({ intent: currentIntent, fill: props.fill }), isTextarea ? 'resize-none' : '', inputClass]"
        />

        <p v-if="error" class="text-red-500 text-xs mt-1 whitespace-pre-line">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import { input } from '~/utils/ui/atoms';

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    type?: string
    error?: string
    isSuccess?: boolean
    isTextarea?: boolean
    maxlength?: number
    autofocus?: boolean,
    inputClass?: string
    fill?: 'transparent' | 'subtle' | 'solid'
}>(), {
    type: 'text'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'blur': [event: FocusEvent]
}>()

const onInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).value)
}

type InputIntent = 'normal' | 'error' | 'success' | 'disabled'

const currentIntent = computed<InputIntent>(() => {
    if (props.error) return 'error'
    if (props.isSuccess) return 'success'
    return 'normal'
})
</script>