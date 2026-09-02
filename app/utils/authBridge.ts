import type { Ref } from 'vue'
import { shallowRef } from 'vue'

// Мост между Clerk и приложением. Определяет «контракт» auth-провайдера
// (получение JWT-токена, выход, провижининг, прямой вызов worker, загрузка
// картинок) и реактивные флаги userId/isLoaded/isSignedIn/clientUsername.
export interface AuthBridge {
  getToken: (template?: string) => Promise<string | null>
  signOut: () => Promise<void>
  provision: (username: string) => Promise<{ userId: string; created: boolean }>
  requestWorker: <T>(
    path: string,
    options: { method: 'POST'; body?: Record<string, unknown> },
  ) => Promise<T>
  uploadImage: (
    filename: string,
    contentType: string,
    file: Blob | ArrayBuffer,
  ) => Promise<{ objectKey: string; publicUrl: string; size: number; media: { id: string } }>
  userId: Ref<string | null>
  isLoaded: Ref<boolean>
  isSignedIn: Ref<boolean>
  clientUsername: Ref<string | undefined>
}

// Реактивный контейнер моста: playwright/clerk-интеграция подставляет сюда
// реальную реализацию; всё приложение работает только через этот ref.
export const authBridge = shallowRef<AuthBridge | null>(null)
