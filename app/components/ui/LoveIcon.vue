<template>
    <BaseIcon 
        :name="myReaction ? 'loveFilled' : 'loveOutline'"
        :class="className"
    />
</template>

<script lang="ts" setup>
const attrs = useAttrs()

const className = computed(() => {
    const baseClass = 'flex'
    const colorClass = props.myReaction ? 'text-red-500' : 'text-icon-access'
    return `${baseClass} ${colorClass} ${attrs.class || ''}`
})

const props = defineProps<{
    myReaction: boolean
}>()

</script>