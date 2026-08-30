// Централизованная навигация: названия, ссылки и иконки пунктов меню.
// Единый источник правды для сайдбара, нижнего таббара и страниц.
import type { IconName } from '~/utils/ui/icons'

export interface INavItem {
    label: string
    to?: string
    icon?: IconName
    disabled?: boolean
    // Тип пункта: обычная ссылка по умолчанию, 'create' — кнопка создания поста.
    kind?: 'link' | 'create'
}

export const navRoutes = {
    feed: '/feed',
    subscriptions: '/subscriptions',
    subscribers: '/subscribers',
    profile: '/profile',
    login: '/login',
    register: '/register',
} as const

// Пункты сайдбара (десктоп, lg+).
export const sidebarNav: INavItem[] = [
    { label: 'Лента', to: navRoutes.feed, icon: 'image', kind: 'link' },
    { label: 'Мессенджер', icon: 'message', kind: 'link', disabled: true },
]

// Пункты нижнего таббара (мобильные, <lg).
export const tabbarNav: INavItem[] = [
    { label: 'Лента', to: navRoutes.feed, icon: 'image', kind: 'link' },
    { label: 'Мессенджер', icon: 'message', kind: 'link', disabled: true },
    { label: 'Создать', icon: 'plus', kind: 'create' },
    { label: 'Подписки', to: navRoutes.subscriptions, icon: 'loveFilled', kind: 'link' },
    { label: 'Профиль', to: navRoutes.profile, icon: 'user', kind: 'link' },
]

// Брендинг: имя и логотип (используется в шапке, таббаре и модалках входа).
export const brand = {
    name: 'NuxtGram',
    logo: '/logo.svg',
} as const