<template>
    <div v-if="itsMe">
        <AppButton variant="outline" size="base" @click="emit('openEditModalHandler')">
            Изменить
        </AppButton>
    </div>
    <div v-else>
        <AppButton v-if="!isFollowing" @click="follow(props.user.id)" variant="primary" size="base">
            Подписаться
        </AppButton>

        <AppButton v-if="isFollowing" variant="outline" size="base" @click="unfollow(props.user.id)">
            Отписаться
        </AppButton>
    </div>
</template>

<script setup lang="ts">
import { useFollowsStore } from '~/stores/follows';
import type { IUser } from '~/types/user.types';

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