<template>
    <div v-if="itsMe">
        <BaseButton variant="outline" size="base" @click="emit('openEditModalHandler')">
            Изменить профиль
        </BaseButton>
    </div>
    <div v-else>
        <BaseButton v-if="!isFollowing" @click="follow(props.user.id)" variant="primary" size="base">
            Подписаться
        </BaseButton>

        <BaseButton v-if="isFollowing" variant="outline" size="base" @click="unfollow(props.user.id)">
            Отписаться
        </BaseButton>
    </div>
</template>

<script setup lang="ts">
import { useFollowsStore } from '~/stores/follows';
import type { IUser } from '~/types/UserTypes';

const props = defineProps<{
    isFollowing: boolean,
    itsMe: boolean,
    user: IUser,
}>()

const emit = defineEmits<{
    (e: 'openEditModalHandler'): void,
}>()

const { follow, unfollow } = useFollowsStore()

</script>