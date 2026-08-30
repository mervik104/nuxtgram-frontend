<template>
    <div :class="dropdownStyles.menu()" class="absolute z-50 right-0 top-[calc(100%+8px)] min-w-75">
        <UserMenuProfile v-bind="props" @click="$emit('toggleHidden')" />
        <div class="border-t border-gray-700/50 my-1"></div>
        <UserMenuItem text="Настройки">
            <template #icon>
                <AppIcon name="settings" class="flex size-5 text-icon-secondary" />
            </template>
        </UserMenuItem>
        <UserMenuItem text="Режим отображения" @click="toggleTheme">
            <template #icon>
                <AppIcon name="theme" class="flex size-5 text-icon-secondary" />
            </template>
        </UserMenuItem>
        <div class="border-t border-gray-700/50 my-1"></div>
        <UserMenuItem text="Выйти" danger @click="$emit('logout')">
            <template #icon>
                <AppIcon name="exit" class="flex size-5" />
            </template>
        </UserMenuItem>
    </div>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/user.types'
import { dropdown } from '~/utils/ui/atoms';

const props = defineProps<IUser>()

defineEmits<{
    (e: 'logout'): void
    (e: 'toggleHidden'): void
}>()

const dropdownStyles = dropdown({ align: 'end' })

const colorMode = useColorMode()

function toggleTheme() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>