<template>
    <nav v-if="me && !isAuthPage" class="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border-header bg-surface-menu/95 backdrop-blur"
        style="padding-bottom: env(safe-area-inset-bottom)">
        <div class="flex items-stretch h-16">
            <template v-for="tab in tabbarNav" :key="tab.label">
                <button v-if="tab.kind === 'create'" :class="item(false)" @click="createPostHandler">
                    <span class="grid place-items-center size-10 rounded-full bg-surface-accent border border-border-accent">
                        <AppIcon :name="tab.icon" class="size-6" />
                    </span>
                    <span class="text-[11px] font-medium">{{ tab.label }}</span>
                </button>

                <NuxtLink v-else-if="tab.to && !tab.disabled" :to="tab.to" :class="item(isActive(tab.to))">
                    <Avatar v-if="tab.to === '/profile' && me" :avatar="me.avatar" size="xs" class="rounded-full" />
                    <AppIcon v-else :name="tab.icon" class="size-6" />
                    <span class="text-[11px] font-medium">{{ tab.label }}</span>
                </NuxtLink>

                <button v-else :class="item(false)" disabled title="Скоро">
                    <AppIcon :name="tab.icon" class="size-6" />
                    <span class="text-[11px] font-medium">{{ tab.label }}</span>
                </button>
            </template>
        </div>
    </nav>

    <nav v-else-if="!isAuthPage" class="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border-header bg-surface-menu/95 backdrop-blur"
        style="padding-bottom: env(safe-area-inset-bottom)">
        <div class="flex items-center gap-3 h-16 px-4">
            <NuxtLink to="/feed" class="flex items-center gap-2 min-w-0">
                <img :src="brand.logo" class="w-10 h-auto" alt="logo">
                <span class="font-bold text-base text-icon-primary truncate">{{ brand.name }}</span>
            </NuxtLink>

            <div class="flex items-center gap-2 ml-auto shrink-0">
                <ThemeToggle />
                <NuxtLink :class="button({ variant: 'ghost', size: 'sm', rounded: 'full' })" to="/login">
                    Войти
                </NuxtLink>
                <NuxtLink :class="button({ variant: 'primary', size: 'sm', rounded: 'full' })" to="/register">
                    Регистрация
                </NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { tabbarNav, brand } from '~/data/navigation'
import { usePostStore } from '~/stores/post'
import { button, tabbarItem } from '~/utils/ui/atoms'

const route = useRoute()
const authStore = useAuthStore()
const { user: me } = storeToRefs(authStore)
const { openCreateModal } = usePostStore()

const AUTH_PATHS = ['/login', '/register', '/sso-callback']

const isAuthPage = computed(() =>
    AUTH_PATHS.includes(route.path)
)

const item = (active: boolean) => tabbarItem({ active })

function isActive(path: string) {
    if (path === '/') return route.path === '/'
    return route.path.startsWith(path)
}

function createPostHandler() {
    if (me.value) openCreateModal()
    else authStore.openAuthPrompt()
}
</script>