// Глобальный роут-гард авторизации.
//  - НЕ блокирует рендер ожиданием Clerk — первый экран (шапка + скелетоны)
//    показывается сразу, Clerk грузится в фоне;
//  - авторизованного на /login или /register → '/'.
//
// Гости НЕ редиректятся на /login — браузинг открыт, а вход предлагается
// модалкой (AuthPromptModal) при попытке защищённых действий.
//
// Из-за hash-режима SPA проверка строится СИНХРОННО: сначала живой мост
// authBridge (если Clerk уже загружен), иначе фолбэк window.Clerk.session
// (внешний фрейм-кэш этапа гидрации). Никаких await/ожиданий — иначе
// миддлварь блокировала бы первый рендер на время инициализации Clerk.
export default defineNuxtRouteMiddleware((to) => {
  const bridge = authBridge.value

  const isLoggedIn = bridge?.isLoaded.value === true
    ? bridge.isSignedIn.value && !!bridge.userId.value
    : typeof window !== 'undefined' && !!window.Clerk?.session

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return navigateTo('/')
  }
})