import { useClerk } from '@clerk/vue'
import { log, logError } from '~/utils/logger'

// Полный поток аутентификации/регистрации через Clerk (вход по паролю, 2FA,
// device trust, код из email/телефона, регистрация с верификацией email).
// Все переходы — по статусам Clerk signIn/signUp (complete, needs_*).

export type VerificationStrategy = 'email_code' | 'phone_code' | 'backup_code' | 'totp'

/**
 * Бросается, когда Clerk требует дополнительную проверку при входе
 * (новое устройство/браузер или включённая 2FA). UI должен показать поле
 * для ввода кода и вызвать `verifySignInCode`.
 */
export class AdditionalVerificationRequired extends Error {
  strategy: VerificationStrategy

  constructor(strategy: VerificationStrategy) {
    super('Для этого аккаунта требуется дополнительная проверка')
    this.name = 'AdditionalVerificationRequired'
    this.strategy = strategy
  }
}

// Кодовые стратегии первого и второго фактора + какие из второго фактора
// требуют prepare-шага (отправка кода) перед attempt.
const FIRST_FACTOR_CODE_STRATEGIES = ['email_code', 'phone_code'] as const
const SECOND_FACTOR_CODE_STRATEGIES = ['phone_code', 'totp', 'backup_code', 'email_code'] as const
const SECOND_FACTOR_PREPARE_STRATEGIES: ReadonlyArray<VerificationStrategy> = ['phone_code', 'email_code']

// Выбирает первую стратегию из candidates, которую предлагает Clerk
// (supportedFirstFactors/supportedSecondFactors), иначе fallback.
const pickStrategy = <T extends string>(
  candidates: readonly T[],
  offered: Array<{ strategy: string }>,
  fallback: T,
): T => {
  for (const strategy of candidates) {
    if (offered.some((item: { strategy: string }) => item.strategy === strategy)) return strategy
  }
  return fallback
}

export const useClerkAuthFlow = () => {
  const { isLoaded: signInLoaded, signIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp } = useSignUp()
  const clerk = useClerk()

  // Нормализует ошибку Clerk в удобный текст (longMessage → message → дефолт).
  const clerkError = (error: unknown) => {
    if (error && typeof error === 'object') {
      const value = error as { longMessage?: string; message?: string }
      return value.longMessage || value.message || 'Ошибка аутентификации'
    }

    return 'Ошибка аутентификации'
  }

  // Отправляет код первого фактора (email/телефон). Возвращает стратегию.
  // Возвращает стратегию для последующего attemptFirstFactor.
  const prepareFirstFactorCode = async (strategy: 'email_code' | 'phone_code') => {
    const signInResource = signIn.value
    if (!signInResource) throw new Error('Вход не найден')

    const factor = (signInResource.supportedFirstFactors ?? []).find(
      (item: { strategy: string }) => item.strategy === strategy,
    ) as { emailAddressId?: string; phoneNumberId?: string } | undefined

    if (strategy === 'email_code') {
      await signInResource.prepareFirstFactor({ strategy, emailAddressId: factor?.emailAddressId ?? '' })
    } else {
      await signInResource.prepareFirstFactor({ strategy, phoneNumberId: factor?.phoneNumberId ?? '' })
    }
    return strategy
  }

  // Отправляет код второго фактора (2FA / device trust). Возвращает стратегию.
  const prepareSecondFactorCode = async (strategy: 'email_code' | 'phone_code') => {
    const signInResource = signIn.value
    if (!signInResource) throw new Error('Вход не найден')
    await signInResource.prepareSecondFactor({ strategy })
    return strategy
  }

  // Активирует созданную Clerk-сессию (setActive) с логгированием.
  const activateSession = async (sessionId: string) => {
    if (!clerk.value) throw new Error('Clerk недоступен')
    try {
      await clerk.value.setActive({ session: sessionId })
      log('authflow', 'сессия активирована', { sessionId })
    } catch (error) {
      logError('authflow', 'setActive упал', error)
      throw new Error('Проверка пройдена, но не удалось создать сессию. Попробуйте войти ещё раз.')
    }
  }

  // Вход по email+паролю. Порядок статусов:
//  - complete → активируем сессию и возвращаем true;
//  - needs_client_trust / needs_second_factor → готовим код 2FA и бросаем
//    AdditionalVerificationRequired (UI показывает поле кода);
//  - needs_first_factor → отправляем код первого фактора и тоже бросаем
//    AdditionalVerificationRequired.
  const signInWithPassword = async (email: string, password: string) => {
    if (!signInLoaded.value || !signIn.value) {
      throw new Error('Clerk ещё не загрузился')
    }

    try {
      await signIn.value.create({
        strategy: 'password',
        identifier: email,
        password,
      })
    } catch (error) {
      log('authflow', 'вход: create упал', { error: clerkError(error) })
      throw new Error(clerkError(error))
    }

    const status = signIn.value.status
    if (status === 'complete') {
      log('authflow', 'вход по паролю успешен', { status, createdSessionId: signIn.value.createdSessionId })
      if (signIn.value.createdSessionId) {
        await activateSession(signIn.value.createdSessionId)
      }
      return true
    }

    if (status === 'needs_client_trust' || status === 'needs_second_factor') {
      const supported = (signIn.value.supportedSecondFactors ?? []) as Array<{ strategy: string }>
      const strategy = pickStrategy(SECOND_FACTOR_CODE_STRATEGIES, supported, 'phone_code')
      const prepared = SECOND_FACTOR_PREPARE_STRATEGIES.includes(strategy)
      if (prepared) {
        await prepareSecondFactorCode(strategy as 'email_code' | 'phone_code')
      }
      log('authflow',
        status === 'needs_client_trust'
          ? 'вход: новое устройство, требуется подтверждение (device trust)'
          : 'вход: требуется 2FA',
        { status, strategy, prepared })
      throw new AdditionalVerificationRequired(strategy)
    }

    if (status === 'needs_first_factor') {
      const supported = (signIn.value.supportedFirstFactors ?? []) as Array<{ strategy: string }>
      const strategy = pickStrategy(FIRST_FACTOR_CODE_STRATEGIES, supported, 'email_code')
      await prepareFirstFactorCode(strategy)
      log('authflow', 'вход: отправлен код первого фактора', { strategy })
      throw new AdditionalVerificationRequired(strategy)
    }

    log('authflow', 'вход: статус требует внимания', { status })
    throw new Error('Для этого аккаунта требуется дополнительная проверка')
  }

  // Повторная отправка кода входа: для второго фактора (2FA/device trust) —
  // prepareSecondFactor, иначе prepareFirstFactor. Бросает Error для
  // стратегий без prepare-шага (totp/backup_token — код API, не email/SMS).
  const resendSignInCode = async (strategy: VerificationStrategy) => {
    if (!signIn.value) throw new Error('Вход не найден')

    if (signIn.value.status === 'needs_second_factor' || signIn.value.status === 'needs_client_trust') {
      if (!SECOND_FACTOR_PREPARE_STRATEGIES.includes(strategy)) {
        throw new Error('Для этого способа проверки повторная отправка кода не нужна')
      }
      await prepareSecondFactorCode(strategy as 'email_code' | 'phone_code')
    } else {
      if (!FIRST_FACTOR_CODE_STRATEGIES.includes(strategy as 'email_code' | 'phone_code')) {
        throw new Error('Для этого способа проверки повторная отправка кода не нужна')
      }
      await prepareFirstFactorCode(strategy as 'email_code' | 'phone_code')
    }
    log('authflow', 'код входа отправлен повторно', { strategy })
  }

  // Проверка кода входа: attemptFirstFactor / attemptSecondFactor по статусу.
  // Если после первого фактора Clerk требует ещё 2FA — готовим следующий код
  // и снова бросаем AdditionalVerificationRequired. При complete — активируем
  // сессию (не без createdSessionId) и возвращаем true.
  const verifySignInCode = async (code: string, strategy: VerificationStrategy) => {
    if (!signIn.value) throw new Error('Вход не найден')

    try {
      if (signIn.value.status === 'needs_second_factor' || signIn.value.status === 'needs_client_trust') {
        if (
          !SECOND_FACTOR_PREPARE_STRATEGIES.includes(strategy) &&
          strategy !== 'totp' &&
          strategy !== 'backup_code'
        ) {
          throw new Error('Для этого способа проверки неподходящая стратегия')
        }
        await signIn.value.attemptSecondFactor({ strategy, code })
      } else {
        if (!FIRST_FACTOR_CODE_STRATEGIES.includes(strategy as 'email_code' | 'phone_code')) {
          throw new Error('Для этого способа проверки неподходящая стратегия')
        }
        await signIn.value.attemptFirstFactor({ strategy: strategy as 'email_code' | 'phone_code', code })
      }
    } catch (error) {
      const message = clerkError(error)
      log('authflow', 'вход: код не принят', { error: message })
      throw new Error(message)
    }

    if (signIn.value.status === 'needs_second_factor') {
      const supported = (signIn.value.supportedSecondFactors ?? []) as Array<{ strategy: string }>
      const nextStrategy = pickStrategy(SECOND_FACTOR_CODE_STRATEGIES, supported, 'phone_code')
      if (SECOND_FACTOR_PREPARE_STRATEGIES.includes(nextStrategy)) {
        await prepareSecondFactorCode(nextStrategy as 'email_code' | 'phone_code')
      }
      log('authflow', 'первый фактор принят, теперь требуется 2FA', { strategy: nextStrategy })
      throw new AdditionalVerificationRequired(nextStrategy)
    }

    if (signIn.value.status !== 'complete') {
      log('authflow', 'вход: код принят, но статус не complete', { status: signIn.value.status })
      throw new Error('Код принят, но вход ещё не завершён. Попробуйте ещё раз.')
    }

    if (!signIn.value.createdSessionId) {
      throw new Error('Код принят, но сессия не создана. Попробуйте ещё раз.')
    }

    await activateSession(signIn.value.createdSessionId)
    log('authflow', 'вход с доп. проверкой завершён', { createdSessionId: signIn.value.createdSessionId })
    return true
  }

  // Начало регистрации: создаёт аккаунт Clerk. Если требуется верификация email —
  // отправляем код и возвращаем false (UI переходит к полю кода); если статус
  // complete сразу — возвращаем true (дальше provision и переходим на /feed).
  const startSignUp = async (email: string, password: string) => {
    if (!signUpLoaded.value || !signUp.value) {
      throw new Error('Clerk ещё не загрузился')
    }

    try {
      await signUp.value.create({
        emailAddress: email,
        password,
      })
    } catch (error) {
      log('authflow', 'регистрация: create упал', { error: clerkError(error) })
      throw new Error(clerkError(error))
    }

    if (
      signUp.value.status === 'missing_requirements' &&
      signUp.value.unverifiedFields.includes('email_address')
    ) {
      try {
        await signUp.value.prepareEmailAddressVerification({ strategy: 'email_code' })
      } catch (error) {
        throw new Error(clerkError(error))
      }
      log('authflow', 'регистрация: отправлен код подтверждения', { signUpId: signUp.value.id })
      return false
    }

    if (signUp.value.status !== 'complete') {
      throw new Error('Регистрация требует дополнительных данных')
    }

    log('authflow', 'регистрация завершена сразу (без кода)', { createdUserId: signUp.value.createdUserId })
    return true
  }

  // Проверка кода подтверждения email при регистрации; при complete —
  // активирует созданную Clerk-сессию (setActive).
  const verifySignUp = async (code: string) => {
    if (!signUp.value) throw new Error('Регистрация не найдена')

    try {
      await signUp.value.attemptEmailAddressVerification({ code })
    } catch (error) {
      log('authflow', 'проверка кода: attempt упал', { error: clerkError(error) })
      throw new Error(clerkError(error))
    }

    if (signUp.value.status !== 'complete') {
      log('authflow', 'проверка кода: статус не complete', { status: signUp.value.status })
      throw new Error('Код принят, но регистрация ещё не завершена')
    }

    log('authflow', 'email подтверждён, активирую сессию', {
      signUpId: signUp.value.id,
      createdSessionId: signUp.value.createdSessionId,
      createdUserId: signUp.value.createdUserId,
    })

    const createdSessionId = signUp.value.createdSessionId
    if (createdSessionId && clerk.value) {
      await activateSession(createdSessionId)
    }
  }

  // Повторная отправка кода подтверждения email при регистрации.
  const resendSignUpCode = async () => {
    if (!signUp.value) throw new Error('Регистрация не найдена')

    try {
      await signUp.value.prepareEmailAddressVerification({ strategy: 'email_code' })
      log('authflow', 'код отправлен повторно', { signUpId: signUp.value.id })
    } catch (error) {
      logError('authflow', 'повторная отправка кода упала', error)
      throw new Error(clerkError(error))
    }
  }

  return {
    signInWithPassword,
    resendSignInCode,
    verifySignInCode,
    startSignUp,
    verifySignUp,
    resendSignUpCode,
  }
}