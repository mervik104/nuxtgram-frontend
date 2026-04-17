<template>
    <div :class="[sizeClasses[size], 'overflow-hidden rounded-full']">
        <img :src="avatar ? avatarURL(avatar.thumbnailURL) : '/defaultAvatar.png'" alt="avatar"
            class="w-full h-full object-cover" :draggable="false"/>
    </div>
</template>

<script setup lang="ts">
import type { IAvatarType } from '~/types/UserTypes';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const { avatarURL } = useAvatar()

defineProps<{
    avatar?: IAvatarType,
    size: AvatarSize
}>()

const sizeClasses: Record<AvatarSize, string> = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
    '2xl': 'w-36 h-36',
}

</script>