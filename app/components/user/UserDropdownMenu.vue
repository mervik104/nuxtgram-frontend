<template>
    <div :class="dropdownStyles.menu()" class="absolute z-50 right-0 top-[calc(100%+8px)] min-w-75">
        <UserDropdownProfile v-bind="props" @click="$emit('toggleHidden')" />
        <div class="border-t border-gray-700/50 my-1"></div>
        <UserDropdownItem text="Настройки">
            <template #icon>
                <BaseIcon name="settings" class="flex size-5 text-icon-secondary" />
            </template>
        </UserDropdownItem>
        <UserDropdownItem text="Режим отображения">
            <template #icon>
                <BaseIcon name="theme" class="flex size-5 text-icon-secondary" />
            </template>
        </UserDropdownItem>
        <div class="border-t border-gray-700/50 my-1"></div>
        <UserDropdownItem text="Выйти" danger @click="$emit('logout')">
            <template #icon>
                <BaseIcon name="exit" class="flex size-5" />
            </template>
        </UserDropdownItem>
    </div>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/UserTypes'
import { dropdown } from '~/utils/ui/atoms';

const props = defineProps<IUser>()

defineEmits<{
    (e: 'logout'): void
    (e: 'toggleHidden'): void
}>()

const dropdownStyles = dropdown({ align: 'end' })
</script>