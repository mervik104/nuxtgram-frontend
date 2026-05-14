<template>
    <Icon :name="icons[props.name]" :class="props.class">
        <template #loading>
            <USkeleton class="rounded" :class="props.class" />
        </template>
    </Icon>
</template>

<script setup lang="ts">
const icons = {
    square: 'ic:baseline-square',
    home: 'mingcute:home-3-fill',
    arrowUp: 'tabler:arrow-up',
    arrowUpDashed: 'tabler:arrow-narrow-up-dashed',
    camera: 'material-symbols:android-camera',
    cross: 'maki:cross-11',
    exit: 'fluent:arrow-exit-24-filled',
    settings: 'material-symbols:settings',
    share: 'mingcute:share-forward-line',
    theme: 'material-symbols:light-mode',
    trash: 'solar:trash-bin-trash-bold',
    loveOutline: 'solar:heart-linear',
    loveFilled: 'solar:heart-bold',
    message: 'iconamoon:comment-bold',
    menuDots: 'solar:menu-dots-bold',
    right: 'mingcute:right-fill',
    left: 'mingcute:left-fill',
    paperclip: 'streamline-flex:paperclip-1',
    image: 'mdi:file-image-box'
} as const

type IconName = keyof typeof icons

const props = withDefaults(defineProps<{
    name?: IconName
    class?: string
}>(), {
    name: 'square',
    class: 'size-5 text-icon-primary flex'
})
</script>