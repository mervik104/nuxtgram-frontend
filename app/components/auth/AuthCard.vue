<template>
  <div class="absolute bg-surface-base right-0 bottom-0 left-0 top-0 content-center">
    <div :class="['p-8 mx-auto flex flex-col bg-surface-secondary rounded-xl justify-center gap-6', widthClass]">
      <AuthHeader>{{ title }}</AuthHeader>
      
      <div class="flex justify-center">
        <div class="flex justify-center align-center mb-auto gap-3 flex-col" :class="innerWidthClass">
          <slot name="form-fields" />
          <slot name="buttons" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  title: string
  width?: 'auto' | 'fixed'
}

const props = withDefaults(defineProps<Props>(), {
  width: 'auto'
})

const widthClass = computed(() => {
  return props.width === 'fixed' ? 'w-[480px]' : 'w-max'
})

const innerWidthClass = computed(() => {
  return props.width === 'fixed' ? 'w-full' : 'w-72'
})
</script>