// Копирует текст в буфер. В secure-контексте (https/localhost) использует
// navigator.clipboard; в небезопасном (LAN-IP, как в локальной разработке) —
// фолбэк через скрытый textarea + document.execCommand('copy').
export async function copyToClipboard(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // продолжаем через execCommand fallback
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}