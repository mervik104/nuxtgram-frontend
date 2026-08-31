// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  spaLoadingTemplate: true,
  hooks: {
    "prerender:routes"({ routes }) {
      routes.clear() //Do not generate any routes
    }
  },
  router: {
    options: {
      hashMode: true,
    }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      API_URL: process.env.API_URL,
      SURREALDB_URL: process.env.SURREALDB_URL,
      SURREALDB_NAMESPACE: process.env.SURREALDB_NAMESPACE,
      SURREALDB_DATABASE: process.env.SURREALDB_DATABASE,
      CLERK_JWT_TEMPLATE: process.env.CLERK_JWT_TEMPLATE,
      WORKER_URL: process.env.WORKER_URL || 'https://nuxtgram-media-worker.stepanenkoboris064.workers.dev',
    }
  },
  app: {
    head: {
      title: 'Nuxtgram',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg', href: '/logo.svg' },
      ],
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  extends: ['./layers/ui'],
  modules: ['@pinia/nuxt', 'nuxt-toast', '@nuxt/ui', 'nuxt-single-html', '@nuxtjs/color-mode', '@vueuse/nuxt', '@nuxt/icon', '@clerk/nuxt'],
  toast: {
    composableName: 'useNotification', // Customize the composable name
    settings: {
      position: 'topRight',
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
      backgroundColor: '#2A2F33',
      closeOnEscape: true,
      close: true,
      drag: true,
      displayMode: 1000,
      timeout: 1500,
    }
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'nuxt-color-mode'
  },

  // Иконки: заранее собираем нужные в клиентский бандл, чтобы не дёргать
  // api.iconify.design в рантайме (отдельные мелкие запросы + паузы между ними).
  // scan ловит литеральные имена вида 'collection:icon' в исходниках (в т.ч. в
  // app/utils/ui/icons.ts), иконки кладутся в localStorage и не грузятся по сети.
  icon: {
    clientBundle: {
      scan: {
        globInclude: ['{app,shared,layers}/**', 'node_modules/@nuxt/ui/dist/**'],
        globExclude: ['node_modules', 'dist'],
      },
      icons: [
        'devicon:google',
        'fluent:arrow-exit-24-filled',
        'ic:baseline-plus',
        'ic:baseline-square',
        'iconamoon:comment-bold',
        'maki:cross-11',
        'material-symbols:android-camera',
        'material-symbols:light-mode',
        'material-symbols:settings',
        'mdi:file-image-box',
        'mingcute:home-3-fill',
        'mingcute:left-fill',
        'mingcute:right-fill',
        'mingcute:share-forward-line',
        'mingcute:user-3-fill',
        'simple-icons:x',
        'solar:heart-bold',
        'solar:heart-linear',
        'solar:menu-dots-bold',
        'solar:trash-bin-trash-bold',
        'streamline-flex:paperclip-1',
        'tabler:arrow-narrow-up-dashed',
        'tabler:arrow-up',
      ],
    },
  },

  clerk: {
    skipServerMiddleware: true,
  },
  
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  pinia: {
    /**
     * Automatically add stores dirs to the auto imports. This is the same as
     * directly adding the dirs to the `imports.dirs` option. If you want to
     * also import nested stores, you can use the glob pattern `./stores/**`
     * (on Nimport { API_URL } from './app/utils/constants';
uxt 3) or `app/stores/**` (on Nuxt 4+)
     *
     * @default `['stores']`
     */
    storesDirs: []
  },
})
