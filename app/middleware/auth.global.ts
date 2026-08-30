// Глобальный роут-гард авторизации.
//  - ждёт загрузки Clerk (до WAIT_FOR_CLERK_MS);
//  - авторизованного на /login или /register → '/'.
//
// Гости НЕ редиректятся на /login — браузинг открыт, а вход предлагается
// модалкой (AuthPromptModal) при попытке защищённых действий.
//
// Из-за hash-режима SPA проверка строится на мосте authBridge; фолбэк —
// window.Clerk.session (внешний фрейм-кэш этапа гидрации).
const WAIT_FOR_CLERK_MS = 4000

export default defineNuxtRouteMiddleware(async (to) => {
  let bridge = authBridge.value

  if (!bridge || !bridge.isLoaded.value) {
    const deadline = Date.now() + WAIT_FOR_CLERK_MS
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      bridge = authBridge.value
      if (bridge?.isLoaded.value) break
    }
  }

  const isLoggedIn = bridge?.isLoaded.value === true
    ? bridge.isSignedIn.value && !!bridge.userId.value
    : typeof window !== 'undefined' && !!window.Clerk?.session

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return navigateTo('/')
  }
})