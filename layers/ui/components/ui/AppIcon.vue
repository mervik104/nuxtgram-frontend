<template>
    <Icon :name="icons[props.name]" :class="props.class">
        <template #loading>
            <USkeleton class="rounded" :class="props.class" />
        </template>
    </Icon>
</template>

<script setup lang="ts">
import { icons, type IconName } from '~/utils/ui/icons'

const props = withDefaults(defineProps<{
    name?: IconName
    class?: string
}>(), {
    name: 'square',
    class: 'size-5 text-icon-primary flex'
})
</script>