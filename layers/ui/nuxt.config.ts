import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [
    fileURLToPath(new URL('./assets/css/tokens.css', import.meta.url)),
  ],
  components: [
    {
      path: fileURLToPath(new URL('./components', import.meta.url)),
      pathPrefix: false,
    },
  ],
})
