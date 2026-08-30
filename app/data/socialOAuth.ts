// Конфигурация OAuth-провайдеров для входа/регистрации через соцсети.
// Единый источник правды для кнопок входа (LoginPage/RegisterPage).
// Стратегии — oauth_<provider> по документации Clerk.
import type { OAuthStrategy } from '@clerk/shared/types'
import type { IconName } from '~/utils/ui/icons'

export interface ISocialProvider {
    strategy: OAuthStrategy
    label: string
    icon: IconName
}

// Провайдеры, включённые в инстансе Clerk.
export const socialProviders: ISocialProvider[] = [
    { strategy: 'oauth_google', label: 'Google', icon: 'google' },
]

export type { OAuthStrategy }