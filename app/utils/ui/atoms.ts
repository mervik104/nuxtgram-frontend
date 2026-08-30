// Дизайн-токены компонентов (tailwind-variants). Каждый atom — конфигуратор
// className: базовые стили + варианты (variant/size/…). Используется компонентами
// UI (Button, Input, Avatar, Card, …). Правка вариантов здесь меняет весь UI.
// TODO: часть размеров/отступов перенести в адаптивные tailwind-варианты (см. docs).
import { tv } from 'tailwind-variants'

// Кнопки: variant (цвет/роль), size, скругление, disabled/loading/error-состояния.
export const button = tv({
    base: 'inline-flex items-center justify-center transition-colors font-medium outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 border border-transparent',
    variants: {
        variant: {
            primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:ring-blue-500',
            success:   'bg-green-600 text-white hover:bg-green-700 shadow-sm focus-visible:ring-green-500',
            secondary: 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 focus-visible:ring-gray-500',
            outline:   'bg-transparent text-gray-300 border border-gray-600 hover:bg-gray-800 focus-visible:ring-gray-500',
            ghost:     'bg-transparent text-gray-200 hover:bg-gray-800 focus-visible:ring-gray-500',
            text:      'bg-transparent text-gray-200 hover:text-gray-400',
            danger:    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        },
        size: {
            sm:   'px-3 py-1.5 text-sm gap-1.5',
            base: 'px-5 py-1.5 text-sm gap-1.5',
            md:   'px-4 py-2 text-base gap-2',
            lg:   'px-4 py-2 text-base gap-2.5 sm:px-5 sm:py-2.5 sm:text-lg sm:gap-2.5',
            xl:   'px-4 py-2 text-lg gap-2.5 sm:px-5 sm:py-2.5 sm:text-xl sm:gap-3',
        },
        rounded: {
            none: 'rounded-none',
            sm:   'rounded-sm',
            md:   'rounded-md',
            lg:   'rounded-lg',
            xl:   'rounded-xl',
            '2xl':'rounded-2xl',
            full: 'rounded-full',
        },
        disabled: { true: 'cursor-not-allowed pointer-events-none' },
        loading:  { true: 'cursor-wait pointer-events-none' },
        error:    { true: 'ring-2 ring-red-500' },
    },
    compoundVariants: [
        { variant: 'primary',   disabled: true, class: 'bg-blue-800 shadow-none opacity-80' },
        { variant: 'success',   disabled: true, class: 'bg-green-800 shadow-none opacity-80' },
        { variant: 'secondary', disabled: true, class: 'opacity-50' },
        { variant: 'outline',   disabled: true, class: 'opacity-50' },
        { variant: ['primary', 'success', 'danger'], loading: true, class: 'opacity-80' },
    ],
    defaultVariants: { variant: 'ghost', size: 'md', rounded: 'lg' },
})

// Пункты меню (dropdown и похожие списки).
export const menuItem = tv({
    base: 'w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-border-hover',
    variants: {
        variant: {
            default: 'text-white',
            danger:  'text-red-400',
        },
    },
    defaultVariants: { variant: 'default' },
})

// Иконка-кнопка: варианты акцент/ghost/danger, размеры (соотношение сторон).
export const iconButton = tv({
    base: 'inline-flex items-center justify-center transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 cursor-pointer',
    variants: {
        variant: {
            accent:  'bg-surface-accent border border-border-accent text-gray-200 hover:bg-surface-accent-hover hover:scale-110',
            ghost:   'bg-transparent text-gray-200 hover:bg-gray-800',
            danger:  'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
        },
        size: {
            sm: 'w-6 h-6',
            md: 'w-8 h-8',
            lg: 'w-10 h-10',
        },
        rounded: {
            full: 'rounded-full',
            md:   'rounded-md',
        },
    },
    defaultVariants: { variant: 'accent', size: 'sm', rounded: 'full' },
})

// Аватары: кружок с выбором размера (sm…2xl).
export const avatar = tv({
    base: 'rounded-full overflow-hidden bg-gray-700 flex items-center justify-center shrink-0',
    variants: {
        size: {
            sm:  'w-8 h-8',
            md:  'w-10 h-10',
            lg:  'w-14 h-14',
            xl:  'w-24 h-24',
            '2xl': 'w-36 h-36',
        },
    },
    defaultVariants: { size: 'md' },
})

// Текстовые поля: intent (normal/error/success/disabled), размер, заливка.
export const input = tv({
    base: 'w-full px-4 py-2 rounded-lg border text-white placeholder-gray-500 outline-none transition-colors',
    variants: {
        intent: {
            normal:   'border-border-input focus:border-blue-500',
            error:    'border-red-500 focus:border-red-600',
            success:  'border-green-500 focus:border-green-600',
            disabled: 'border-gray-600 bg-gray-800 cursor-not-allowed',
        },
        size: {
            sm: 'text-sm',
            md: 'text-base',
        },
        fill: {
            transparent: 'bg-transparent',
            subtle:      'bg-surface-secondary',
            solid:       'bg-gray-800',
        },
    },
    defaultVariants: { intent: 'normal', size: 'md', fill: 'transparent' },
})

// Многострочный текст: intent, заливка, overflow, resize.
export const textarea = tv({
    base: 'w-full min-h-38 p-2.5 rounded-lg border border-gray-700 text-white text-base placeholder-gray-500 outline-none transition-colors',
    variants: {
        intent: {
            normal:   'focus:border-blue-500',
            error:    'border-red-500 focus:border-red-600',
            disabled: 'border-gray-600 bg-gray-800 cursor-not-allowed',
        },
        fill: {
            solid:       'bg-surface-base',
            subtle:      'bg-surface-secondary',
            transparent: 'bg-transparent',
        },
        overflow: {
            auto:   'overflow-auto',
            hidden: 'overflow-hidden',
        },
        resize: {
            none:     'resize-none',
            vertical: 'resize-y',
        },
    },
    defaultVariants: { intent: 'normal', fill: 'solid', overflow: 'auto', resize: 'vertical' },
})

// Модальные окна: слоты overlay/content/base + ограничение ширины по size.
export const modal = tv({
    slots: {
        overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto',
        content: 'flex flex-col items-center w-full',
        base: 'relative bg-surface-elevated rounded-2xl shadow-xl w-full max-h-full overflow-y-auto',
    },
    variants: {
        size: {
            sm: { base: 'max-w-[20rem]' },
            md: { base: 'max-w-md' },
            lg: { base: 'max-w-2xl' },
            xl: { base: 'max-w-4xl' },
        },
        padding: {
            default: { base: 'p-5 sm:p-6' },
            none: '',
        },
    },
    defaultVariants: { size: 'md', padding: 'default' },
})

// Dropdown: слоты trigger/menu + вертикальное выравнивание (start/end).
export const dropdown = tv({
    slots: {
        trigger: 'inline-flex items-center gap-2 px-3 py-1 rounded-md transition-colors bg-transparent text-gray-200 hover:bg-gray-800',
        menu:    'bg-surface-menu border border-border-hover rounded-lg shadow-lg overflow-hidden py-1',
    },
    variants: {
        align: {
            start: 'origin-top-left',
            end:   'origin-top-right',
        },
    },
    defaultVariants: { align: 'start' },
})

// Карточка с необязательной подсветкой (highlighted — accent-ring).
export const card = tv({
    base: 'bg-surface-base border border-border-subtle rounded-xl p-4 shadow-sm',
    variants: {
        highlighted: { true: 'ring-1 ring-blue-600' },
    },
    defaultVariants: { highlighted: false },
})

// Бейдж-плашка: intent info (синяя) / muted (серая).
export const badge = tv({
    base: 'inline-flex items-center px-2 py-0.5 rounded-full text-sm',
    variants: {
        intent: {
            info:  'bg-blue-500 text-white',
            muted: 'bg-gray-700 text-gray-200',
        },
    },
    defaultVariants: { intent: 'muted' },
})

// Маленький чип (тег, статус); размер влияет только на шрифт.
export const chip = tv({
    base: 'inline-flex items-center px-2 py-1 rounded-full bg-gray-800 text-gray-200',
    variants: {
        size: {
            sm: 'text-xs',
            md: 'text-sm',
        },
    },
    defaultVariants: { size: 'md' },
})

// Спиннер загрузки: тема по цветам, размер по толщине/диаметру кольца.
export const loader = tv({
    base: 'animate-spin rounded-full border-solid box-border inline-flex items-center justify-center',
    variants: {
        size: {
            sm: 'w-6 h-6 border-4',
            md: 'w-10 h-10 border-[6px]',
            lg: 'w-16 h-16 border-8',
            xl: 'w-24 h-24 border-10',
        },
        theme: {
            heavy:   'border-loader-track border-b-loader-shadow',
            primary: 'border-blue-500 border-b-blue-700',
            muted:   'border-gray-500 border-b-gray-700',
            white:   'border-white border-b-gray-300',
        },
    },
    defaultVariants: { size: 'md', theme: 'heavy' },
})

// Иконка-инлайн-бокс по размеру.
export const icon = tv({
    base: 'inline-block',
    variants: {
        size: {
            sm: 'w-4 h-4',
            md: 'w-5 h-5',
            lg: 'w-6 h-6',
        },
    },
    defaultVariants: { size: 'md' },
})

// Текстовые блоки по размеру шрифта.
export const text = tv({
    base: 'text-gray-200 leading-relaxed',
    variants: {
        size: {
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
        },
    },
    defaultVariants: { size: 'md' },
})

// Нижний таббар (mobile-only): пункт с состоянием активен/неактив.
export const tabbarItem = tv({
    base: 'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 transition-colors',
    variants: {
        active: {
            true: 'text-icon-primary',
            false: 'text-icon-secondary hover:text-icon-primary',
        },
    },
    defaultVariants: { active: false },
})

// Юзер-карточка: слоты container/wrapper/info/name/nickname; размер под место
// использования (виджет поста, комментарий, профиль, списки sm/md/lg).
export const userCardVariants = tv({
  slots: {
    container: '',
    wrapper: 'flex items-center gap-3',
    info: 'flex-1 min-w-0',
    name: 'font-medium text-gray-200 truncate',
    nickname: 'font-mono text-gray-500 truncate',
  },
  variants: {
    size: {
      widget: {
        container: '',
        wrapper: 'flex items-center gap-3 px-2 py-2 cursor-pointer select-none',
        name: 'text-md',
        nickname: 'text-sm hover:text-gray-400 active:text-gray-300 cursor-pointer',
      },
      post: {
        container: 'flex items-center justify-between',
        wrapper: 'flex items-center gap-3',
        name: 'text-md cursor-pointer hover:text-gray-300',
        nickname: 'text-[12px]',
      },
      comment: {
        container: 'flex items-center justify-between',
        wrapper: 'flex items-center gap-3',
        name: 'text-md cursor-pointer hover:text-gray-300',
        nickname: '',
      },
      sm: {
        container: 'flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-md text-center',
        nickname: '',
      },
      md: {
        container: 'flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-lg text-center',
        nickname: '',
      },
      lg: {
        container: 'flex gap-4 items-center hover:bg-gray-700/50 rounded-xl p-2 px-3 w-full',
        wrapper: '',
        name: 'text-xl',
        nickname: 'text-gray-400 text-[12px]',
      },
      profile: {
        container: 'flex-1 w-full',
        wrapper: '',
        name: 'text-2xl font-bold text-white',
        nickname: 'text-gray-500 font-mono',
      },
    },
  },
})