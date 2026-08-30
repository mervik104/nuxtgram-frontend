import { useSignIn, useSignUp } from '@clerk/vue'
import type { OAuthStrategy } from '@clerk/shared/types'
import { log, logError } from '~/utils/logger'

// OAuth-вход через соцсети (Google) по кастомному флоу Clerk.
//
// Приложение работает в hash-режиме SPA (роут внутри #/), поэтому
// redirectUrl/redirectUrlComplete собираются как полный URL с hash-роутом:
//   redirectUrl         → страница /sso-callback, где монтируется
//                          <AuthenticateWithRedirectCallback /> (доводит флоу);
//   redirectUrlComplete → куда попасть после успеха (лента).
// Clerk сам умеет работать с hash-роутингом и кладёт параметры OAuth
// в hash этой страницы, поэтому кастомный флоу не ломается.

export const useOAuth = () => {
    const { isLoaded: signInLoaded, signIn } = useSignIn()
    const { isLoaded: signUpLoaded, signUp } = useSignUp()

    const useProvider = (strategy: OAuthStrategy) => {
        const loaded = signInLoaded.value || signUpLoaded.value
        if (!loaded) {
            throw new Error('Clerk ещё не загрузился. Обновите страницу.')
        }
        return strategy
    }

    const startSignInWithProvider = async (strategy: OAuthStrategy) => {
        useProvider(strategy)
        if (!signIn.value) throw new Error('Вход через Clerk недоступен')

        log('oauth', 'вход через провайдера', { strategy })
        try {
            await signIn.value.authenticateWithRedirect({
                strategy,
                redirectUrl: buildHashRedirect('/sso-callback'),
                redirectUrlComplete: buildHashRedirect('/feed'),
            })
        } catch (error) {
            logError('oauth', 'authenticateWithRedirect упал', error)
            throw mapOAuthError(error)
        }
    }

    const startSignUpWithProvider = async (strategy: OAuthStrategy) => {
        useProvider(strategy)
        if (!signUp.value) throw new Error('Регистрация через Clerk недоступна')

        log('oauth', 'регистрация через провайдера', { strategy })
        try {
            await signUp.value.authenticateWithRedirect({
                strategy,
                redirectUrl: buildHashRedirect('/sso-callback'),
                redirectUrlComplete: buildHashRedirect('/feed'),
            })
        } catch (error) {
            logError('oauth', 'authenticateWithRedirect упал', error)
            throw mapOAuthError(error)
        }
    }

    return {
        startSignInWithProvider,
        startSignUpWithProvider,
    }
}

// Собирает полный URL для hash-режима SPA:
// «https://site/path#/sso-callback» — Clerk переадресует сюда после OAuth.
const buildHashRedirect = (route: string) => {
    const { origin, pathname } = window.location
    return `${origin}${pathname}#${route}`
}

// Clerk бросает ошибку без длинного сообщения для «провайдер не подключён» —
// превращаем в понятный текст для тоста/инлайн-ошибки.
const mapOAuthError = (error: unknown): Error => {
    if (error && typeof error === 'object') {
        const value = error as { longMessage?: string; message?: string }
        const text = String(error)

        // Clerk-сервер отклоняет стратегию, которая не включена для текущего
        // окружения (dev/prod): «does not match one of the allowed values…»
        if (text.includes('does not match one of the allowed values') || text.includes('parameter strategy')) {
            return new Error('Этот провайдер не включён в Clerk для этого окружения (Development). Включите его в панели Clerk и обновите страницу.')
        }

        return new Error(value.longMessage || value.message || 'Не удалось выполнить вход. Попробуйте ещё раз.')
    }

    return new Error('Не удалось выполнить вход. Попробуйте ещё раз.')
}