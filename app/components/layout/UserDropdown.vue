<template>
        <div class="absolute z-40 right-3 top-[70px] rounded-md bg-[#171A1C]">
            <div class="py-3">
                <UserDropdownProfile @click="emit('toggleHidden')" v-bind="props">Профиль</UserDropdownProfile>
                <UserDropdownButton>Настройки</UserDropdownButton>
                <UserDropdownButton>Режим отображения</UserDropdownButton>
                <UserDropdownButton @click="emit('logout')">Выйти</UserDropdownButton>
            </div>
        </div>
</template>

<script lang="ts" setup>
import type { IUser } from '~/types/UserTypes';

const emit = defineEmits<{
    (e: 'logout'): void
    (e: 'toggleHidden'): void
}>()

const props = defineProps<IUser>()

</script>