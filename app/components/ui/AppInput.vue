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
            :placeholder="placeholder"
            :class="[inputClasses, inputClass]"
        />

        <p v-if="error" class="text-red-500 text-xs mt-1 whitespace-pre-line">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vAutoAnimate } from '@formkit/auto-animate'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    type?: string
    error?: string
    isSuccess?: boolean
    isTextarea?: boolean
    maxlength?: number
    inputClass?: string
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

const inputClasses = computed(() => [
    'w-full px-4 py-2 rounded-lg border outline-none transition-all',
    props.error ? 'border-red-500' :
    props.isSuccess ? 'border-green-500' :
    'border-gray-500 focus:border-blue-400',
    props.isTextarea ? 'resize-none' : ''
])
</script>