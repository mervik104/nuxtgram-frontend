import { tv } from 'tailwind-variants'

// ==========================================
// BUTTON (Объединил: uButton, dropdownButton, toolbarButton)
// ==========================================
export const button = tv({
    base: 'inline-flex items-center justify-center transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-60',
    variants: {
        variant: {
            primary: 'bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500',
            ghost: 'bg-transparent text-gray-200 hover:bg-gray-800 focus-visible:ring-gray-500',
            text: 'bg-transparent text-gray-200 hover:text-gray-400',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        },
        rounded: { full: 'rounded-full', md: 'rounded-md', none: 'rounded-none', xl: 'rounded-xl', '2xl': 'rounded-2xl', sm: 'rounded-sm', lg: 'rounded-lg' },
        size: { sm: 'px-2 py-1 text-sm gap-1.5', md: 'px-3 py-2 text-base gap-2', lg: 'px-4 py-3 text-lg gap-2.5' }, // Добавил gap для иконок
        disabled: { true: 'cursor-not-allowed' },
        error: { true: 'ring-2 ring-red-500', false: '' },
        loading: { true: 'cursor-wait', false: '' },
    },
    compoundVariants: [
        { variant: ['primary', 'danger'], loading: true, class: 'opacity-80' }
    ],
    defaultVariants: { variant: 'ghost', size: 'md', disabled: false, rounded: 'lg', error: false, loading: false },
})

// ==========================================
// AVATAR (Объединил: avatar, profileAvatar)
// ==========================================
export const avatar = tv({
    base: 'rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0',
    variants: {
        size: { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-24 h-24', '2xl': 'w-36 h-36' },
    },
    defaultVariants: { size: 'md' },
})

// ==========================================
// INPUT (Объединил: appInput, veeInput, postInput)
// ==========================================
export const input = tv({
    base: 'w-full p-2 border rounded-md bg-transparent text-white placeholder-gray-500 focus:outline-none transition-colors',
    variants: {
        intent: {
            normal: 'border-border-input focus:border-blue-500',
            error: 'border-red-500 focus:border-red-600',
            disabled: 'border-gray-600 bg-gray-800 cursor-not-allowed',
        },
        size: { sm: 'text-sm', md: 'text-base' },
    },
    defaultVariants: { intent: 'normal', size: 'md' },
})

// ==========================================
// TEXTAREA
// ==========================================
export const textarea = tv({
    base: 'w-full min-h-10 overflow-hidden border rounded-xl p-2 pr-12 text-white placeholder-gray-500 resize-none outline-none transition-colors',
    variants: {
        intent: {
            normal: 'border-border-input focus:border-blue-500',
            error: 'border-red-500 focus:border-red-600',
            disabled: 'border-gray-600 bg-gray-700 cursor-not-allowed',
        },
        overflow: { auto: 'overflow-auto', hidden: 'overflow-hidden' },
        size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
    },
    defaultVariants: { intent: 'normal', size: 'md', overflow: 'auto' },
})

// ==========================================
// MODAL (Используем slots tv - это супер удобно!)
// ==========================================
export const modal = tv({
    slots: {
        overlay: 'fixed inset-0 flex items-center justify-center z-50 bg-black/60',
        content: 'p-6 mx-auto rounded-2xl bg-surface-elevated w-full flex flex-col items-center shadow-xl',
        base: 'p-5 bg-surface-elevated w-max max-h-full rounded-xl relative',
    },
    variants: {
        size: { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' },
    },
    defaultVariants: { size: 'md' },
})

// ==========================================
// DROPDOWN (Тоже используем slots)
// ==========================================
export const dropdown = tv({
    slots: {
        trigger: 'inline-flex items-center gap-2 px-3 py-1 rounded-md transition-colors bg-transparent text-gray-200 hover:bg-gray-800',
        menu: 'bg-surface-secondary rounded-md shadow-lg py-1 z-50',
    },
    variants: {
        align: { start: 'origin-top-left', end: 'origin-top-right' },
    },
    defaultVariants: { align: 'start' },
})

// ==========================================
// CARD (Объединил: card, postCard)
// ==========================================
export const card = tv({
    base: 'bg-surface-base border border-border-subtle rounded-xl p-4 shadow-sm',
    variants: {
        highlighted: { true: 'ring-1 ring-blue-600' },
    },
    defaultVariants: { highlighted: false },
})

// ==========================================
// MISC (Остальные мелкие атомы)
// ==========================================

export const loader = tv({
    // Заменил inline-block на inline-flex items-center justify-center
    base: 'animate-spin rounded-full border-solid box-border inline-flex items-center justify-center',
    variants: {
        size: { 
            sm: 'w-6 h-6 border-[4px]', 
            md: 'w-10 h-10 border-[6px]', 
            lg: 'w-16 h-16 border-[8px]',
            xl: 'w-24 h-24 border-[10px]'
        },
        theme: {
            heavy: 'border-loader-track border-b-loader-shadow',
            primary: 'border-blue-500 border-b-blue-700',
            muted: 'border-gray-500 border-b-gray-700',
            white: 'border-white border-b-gray-300',
        },
    },
    defaultVariants: { size: 'md', theme: 'heavy' },
})

export const icon = tv({
    base: 'inline-block',
    variants: { size: { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' } },
    defaultVariants: { size: 'md' },
})

export const text = tv({
    base: 'text-gray-200 leading-relaxed',
    variants: { size: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' } },
    defaultVariants: { size: 'md' },
})

export const badge = tv({
    base: 'inline-flex items-center px-2 py-0.5 rounded-full text-sm',
    variants: { intent: { info: 'bg-blue-500 text-white', muted: 'bg-gray-700 text-gray-200' } },
    defaultVariants: { intent: 'muted' },
})

export const chip = tv({
    base: 'inline-flex items-center px-2 py-1 rounded-full bg-gray-800 text-gray-200 text-sm',
})