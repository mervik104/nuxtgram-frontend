<template>
  <PostSkeleton></PostSkeleton>
  <ProfileSkeleton></ProfileSkeleton>

  <div class="min-h-screen p-10 text-white font-sans">
    <div class="max-w-5xl mx-auto space-y-24">

      <header class="border-b border-gray-800 pb-8">
        <h1 class="text-4xl font-bold mb-2">UI Atoms Documentation</h1>
        <p class="text-gray-400 text-lg">Базовые компоненты дизайна, собранные с помощью tailwind-variants (tv)</p>
      </header>

      <!-- ========================================= -->
      <!-- BUTTON -->
      <!-- ========================================= -->
      <section class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-2">Button</h2>
          <p class="text-gray-400 max-w-2xl">
            Универсальная кнопка. Поддерживает 6 визуальных вариантов, 4 размера, состояния ошибок, загрузки и отключения. 
            Используйте <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">variant="primary"</code> для главного действия, 
            <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">variant="ghost"</code> для второстепенного.
          </p>
        </div>

        <!-- Варианты -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Варианты (Variants)</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div v-for="variant in allButtonVariants" :key="variant" class="space-y-2">
              <p class="text-xs text-gray-500 uppercase tracking-wider">{{ variant }}</p>
              <button :class="button({ variant })">Click me</button>
            </div>
          </div>
        </div>

        <!-- Размеры -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Размеры (Sizes)</h3>
          <div class="flex items-end gap-4">
            <div v-for="size in sizes" :key="size" class="space-y-2 text-center">
              <button :class="button({ variant: 'primary', size })">Size {{ size }}</button>
              <p class="text-xs text-gray-500">{{ size }}</p>
            </div>
          </div>
        </div>

        <!-- Состояния -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Состояния (States)</h3>
          <div class="flex flex-wrap gap-4 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <button :class="button({ variant: 'primary', disabled: true })">Disabled</button>
            <button :class="button({ variant: 'success', loading: true })">
              <!-- Здесь должен быть спиннер -->
              Loading...
            </button>
            <button :class="button({ variant: 'primary', error: true })">Error State</button>
            <button :class="button({ variant: 'danger', rounded: 'full' })">Rounded Full</button>
          </div>
          <p class="text-sm text-gray-500">* Для состояния loading рекомендуется внутри кнопки разместить компонент Loader</p>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- LOADER -->
      <!-- ========================================= -->
      <section class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-2">Loader</h2>
          <p class="text-gray-400 max-w-2xl">
            Индикатор загрузки. Тема <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">heavy</code> использует строгий контраст (темный фон, светлый кончик спиннера), 
            что делает его подходящим для большинства фонов.
          </p>
        </div>

        <div class="space-y-6">
          <div v-for="theme in loaderThemes" :key="theme" class="flex items-center gap-6 p-4 bg-gray-900/30 rounded-lg">
            <span class="w-24 text-sm text-gray-400 font-mono">{{ theme }}</span>
            <div class="flex gap-6 items-center">
              <div v-for="size in loaderSizes" :key="size" class="flex flex-col items-center gap-1">
                <div :class="loader({ theme, size })" />
                <span class="text-xs text-gray-600">{{ size }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- AVATAR -->
      <!-- ========================================= -->
      <section class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-2">Avatar</h2>
          <p class="text-gray-400 max-w-2xl">
            Контейнер для аватарок пользователя. Имеет скругленные края и серый фон-заглушку (fallback), если изображение не загрузилось. 
            Внутрь обычно помещается тег <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">&lt;img&gt;</code>.
          </p>
        </div>

        <div class="flex items-end gap-6 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
          <div v-for="size in avatarSizes" :key="size" class="flex flex-col items-center gap-2">
            <div :class="avatar({ size })" class="flex items-center justify-center text-gray-400 font-bold">
              {{ size.charAt(0).toUpperCase() }}
            </div>
            <span class="text-xs text-gray-500">{{ size }}</span>
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- INPUT -->
      <!-- ========================================= -->
      <section class="space-y-8 max-w-xl">
        <div>
          <h2 class="text-3xl font-bold mb-2">Input</h2>
          <p class="text-gray-400 max-w-2xl">
            Текстовое поле ввода. Управляется через пропс <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">intent</code> для изменения цвета рамки (ошибка, успех) 
            и <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">fill</code> для управления фоном.
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm text-gray-400">Normal (fill: transparent)</label>
            <input :class="input()" placeholder="Введите текст..." />
          </div>
          
          <div class="space-y-1">
            <label class="text-sm text-gray-400">Solid Background (fill: solid)</label>
            <input :class="input({ fill: 'solid' })" placeholder="Введите текст..." />
          </div>

          <div class="space-y-1">
            <label class="text-sm text-red-400">Error (intent: error)</label>
            <input :class="input({ intent: 'error' })" value="Некорректный email" />
          </div>

          <div class="space-y-1">
            <label class="text-sm text-green-400">Success (intent: success)</label>
            <input :class="input({ intent: 'success', fill: 'subtle' })" value="valid@email.com" />
          </div>

          <div class="space-y-1">
            <label class="text-sm text-gray-500">Disabled (intent: disabled)</label>
            <input :class="input({ intent: 'disabled' })" disabled placeholder="Недоступно" />
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- TEXTAREA -->
      <!-- ========================================= -->
      <section class="space-y-8 max-w-xl">
        <div>
          <h2 class="text-3xl font-bold mb-2">Textarea</h2>
          <p class="text-gray-400 max-w-2xl">
            Многострочное поле ввода. По умолчанию имеет фон <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">solid</code>. 
            Можно отключить изменение размера через <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">resize="none"</code>.
          </p>
        </div>

        <div class="space-y-4">
          <textarea :class="textarea()" placeholder="Оставьте ваш отзыв... (Можно растягивать)" />
          
          <div class="space-y-1">
            <label class="text-sm text-red-400">Error State</label>
            <textarea :class="textarea({ intent: 'error', resize: 'none' })" placeholder="Поле обязательно для заполнения" />
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- CARD -->
      <!-- ========================================= -->
      <section class="space-y-8 max-w-md">
        <div>
          <h2 class="text-3xl font-bold mb-2">Card</h2>
          <p class="text-gray-400 max-w-2xl">
            Базовый контейнер для контента. Используйте <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">highlighted: true</code>, 
            чтобы привлечь внимание к карточке (например, текущий выбранный тариф или элемент).
          </p>
        </div>

        <div class="space-y-4">
          <div :class="card()">
            <h4 class="font-bold mb-1 text-white">Стандартная карточка</h4>
            <p :class="text({ size: 'sm' })">Используется для оборачивания контента, постов или виджетов.</p>
          </div>

          <div :class="card({ highlighted: true })">
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-bold text-white">Выделенная карточка</h4>
              <span :class="badge({ intent: 'info' })">Active</span>
            </div>
            <p :class="text({ size: 'sm' })">Имеет синее свечение вокруг себя (ring-1 ring-blue-600).</p>
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- DROPDOWN -->
      <!-- ========================================= -->
      <section class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-2">Dropdown</h2>
          <p class="text-gray-400 max-w-2xl">
            Выпадающее меню, основанное на слотах. Разделено на триггер (<code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">.trigger()</code>) 
            и само меню (<code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">.menu()</code>). 
            Выравнивание задается через <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">align="end"</code>.
          </p>
        </div>

        <div class="flex flex-wrap gap-12 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
          <div class="space-y-2">
            <p class="text-sm text-gray-500 mb-2">Align: Start (default)</p>
            <div :class="dropdown().trigger()">⚙️ Настройки</div>
            <div class="mt-2 w-48">
              <div :class="dropdown().menu()">
                <div class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Профиль</div>
                <div class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Выход</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <p class="text-sm text-gray-500 mb-2">Align: End</p>
            <div :class="dropdown({ align: 'end' }).trigger()">🙂 Профиль</div>
            <div class="mt-2 w-48 flex justify-end">
              <div :class="dropdown({ align: 'end' }).menu()">
                <div class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Мой аккаунт</div>
                <div class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Безопасность</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- MODAL -->
      <!-- ========================================= -->
      <section class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-2">Modal</h2>
          <p class="text-gray-400 max-w-2xl">
            Компонент модального окна, построенный на слотах: <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">.overlay()</code> для фона, 
            <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">.content()</code> для центрированного контента и 
            <code class="text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">.base()</code> для произвольного позиционирования.
          </p>
        </div>

        <!-- Демо без фиксированного позиционирования, чтобы можно было видеть в потоке -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="size in ['sm', 'md', 'lg', 'xl']" :key="size" class="space-y-2">
            <p class="text-xs text-gray-500 uppercase">Size: {{ size }}</p>
            <div :class="modal({ size }).content()" class="border border-gray-700 h-32 flex items-center justify-center text-gray-400">
              Content {{ size }}
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================= -->
      <!-- MISC ATOMS -->
      <!-- ========================================= -->
      <section class="space-y-16">
        <h2 class="text-3xl font-bold border-b border-gray-800 pb-4">Вспомогательные атомы</h2>

        <!-- TEXT -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Text</h3>
          <p class="text-gray-400 text-sm mb-4">Базовая обертка для текста. Обеспечивает единообразный цвет и межстрочный интервал (leading-relaxed).</p>
          <div class="p-4 bg-gray-900/50 rounded-lg space-y-2 border border-gray-800">
            <p :class="text({ size: 'sm' })">Текст небольшого размера (sm) — подходит для подписей и второстепенной информации.</p>
            <p :class="text({ size: 'md' })">Стандартный текст (md) — основной текстовый контент интерфейса.</p>
            <p :class="text({ size: 'lg' })">Крупный текст (lg) — заголовки блоков или выделенные акценты.</p>
          </div>
        </div>

        <!-- BADGE -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Badge</h3>
          <p class="text-gray-400 text-sm mb-4">Метка статуса. Имеет два intents: info (активный/синий) и muted (приглушенный/серый).</p>
          <div class="flex gap-4 items-center">
            <span :class="badge({ intent: 'info' })">Online</span>
            <span :class="badge({ intent: 'muted' })">Offline</span>
            <span :class="badge({ intent: 'info' })">New</span>
          </div>
        </div>

        <!-- CHIP -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Chip</h3>
          <p class="text-gray-400 text-sm mb-4">Простой тег/чип. Всегда имеет одинаковый стиль (темный фон, скругленные края). Подходит для списков тегов.</p>
          <div class="flex gap-2 flex-wrap">
            <span :class="chip()">Vue.js</span>
            <span :class="chip()">Tailwind</span>
            <span :class="chip()">TypeScript</span>
          </div>
        </div>

        <!-- ICON -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-200">Icon</h3>
          <p class="text-gray-400 text-sm mb-4">Контейнер для SVG иконок. Задает фиксированные размеры в зависимости от пропса size, чтобы иконки выглядели ровно в линии с текстом.</p>
          <div class="flex gap-6 items-end p-4 bg-gray-900/50 rounded-lg border border-gray-800">
            <div v-for="size in ['sm', 'md', 'lg']" :key="size" class="flex flex-col items-center gap-2">
              <!-- Заглушка вместо реальной SVG -->
              <div :class="icon({ size })" class="bg-gray-400 rounded-sm" />
              <span class="text-xs text-gray-500">{{ size }}</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
// Импортируем атомы (предполагается путь из твоего вопроса)
import { button, input, textarea, badge, chip, card, dropdown, modal, text, icon, avatar, loader } from '~/utils/ui/atoms'

const sizes = ['sm', 'md', 'lg']
const allButtonVariants = ['primary', 'success', 'secondary', 'ghost', 'text', 'danger']

const loaderSizes = ['sm', 'md', 'lg', 'xl']
const loaderThemes = ['heavy', 'primary', 'muted', 'white']

const avatarSizes = ['sm', 'md', 'lg', 'xl', '2xl']
</script>

<style scoped>
/* Визуальные хаки для документации, чтобы модалки не фиксировались поверх всего экрана при скролле */
section:has([class*="fixed"]) {
  position: relative;
  z-index: 0;
}
section:has([class*="fixed"]) [class*="fixed"] {
  position: relative !important;
  inset: auto !important;
}
</style>