<template>
  <div class="p-10 space-y-16 text-white">

    <!-- ========================================= -->
    <!-- BUTTON -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Buttons (Base)</h2>

      <div class="grid grid-cols-4 gap-6">
        <div v-for="variant in buttonVariants" :key="variant" class="space-y-3">
          <p class="text-sm text-gray-500">{{ variant }}</p>

          <BaseButton
            v-for="size in sizes"
            :key="size"
            :variant="variant"
            :size="size"
          >
            {{ variant }} {{ size }}
          </BaseButton>
        </div>
      </div>

      <div class="flex gap-4 flex-wrap pt-4">
        <BaseButton variant="primary" disabled>Disabled</BaseButton>
        <BaseButton variant="danger" :loading="true">Loading</BaseButton>
        <BaseButton variant="primary" :error="true">Error</BaseButton>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- LOADER -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Loader (Base)</h2>

      <div v-for="theme in loaderThemes" :key="theme" class="space-y-2">
        <p class="text-sm text-gray-500">{{ theme }}</p>

        <div class="flex gap-6">
          <BaseLoader
            v-for="size in loaderSizes"
            :key="size"
            :theme="theme"
            :size="size"
          />
        </div>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- AVATAR -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Avatar (tv)</h2>

      <div class="flex gap-4 items-center">
        <div
          v-for="size in avatarSizes"
          :key="size"
          :class="avatar({ size})"
        />
      </div>
    </section>

    <!-- ========================================= -->
    <!-- INPUT -->
    <!-- ========================================= -->
    <section class="space-y-6 max-w-md">
      <h2 class="text-2xl font-bold">Input (tv)</h2>

      <input :class="input()" placeholder="Normal" />

      <input :class="input({ intent: 'error' })" placeholder="Error" />

      <input :class="input({ intent: 'disabled' })" disabled placeholder="Disabled" />

      <input :class="input({ size: 'sm' })" placeholder="Small" />
    </section>

    <!-- ========================================= -->
    <!-- TEXTAREA -->
    <!-- ========================================= -->
    <section class="space-y-6 max-w-md">
      <h2 class="text-2xl font-bold">Textarea (tv)</h2>

      <textarea :class="textarea()" placeholder="Normal" />

      <textarea :class="textarea({ intent: 'error' })" placeholder="Error" />

      <textarea :class="textarea({ size: 'lg' })" placeholder="Large" />

      <textarea :class="textarea({ overflow: 'hidden' })" placeholder="Hidden overflow" />
    </section>

    <!-- ========================================= -->
    <!-- BADGE -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Badge (tv)</h2>

      <div class="flex gap-4">
        <span :class="badge({ intent: 'info' })">Info</span>
        <span :class="badge({ intent: 'muted' })">Muted</span>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- CHIP -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Chip (tv)</h2>

      <div class="flex gap-4">
        <span :class="chip()">Chip</span>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- CARD -->
    <!-- ========================================= -->
    <section class="space-y-6 max-w-md">
      <h2 class="text-2xl font-bold">Card (tv)</h2>

      <div :class="card()">
        Default card
      </div>

      <div :class="card({ highlighted: true })">
        Highlighted card
      </div>
    </section>

    <!-- ========================================= -->
    <!-- DROPDOWN -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Dropdown (tv slots)</h2>

      <div class="flex gap-6">
        <div :class="dropdown().trigger">Trigger</div>
        <div :class="dropdown({ align: 'end' }).trigger">Trigger End</div>
      </div>

      <div class="flex gap-6">
        <div :class="dropdown().menu">Menu</div>
        <div :class="dropdown({ align: 'end' }).menu">Menu End</div>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- MODAL -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Modal (tv slots)</h2>

      <div class="flex gap-6">
        <div :class="modal({ size: 'sm' }).content">SM</div>
        <div :class="modal({ size: 'md' }).content">MD</div>
        <div :class="modal({ size: 'lg' }).content">LG</div>
        <div :class="modal({ size: 'xl' }).content">XL</div>
      </div>
    </section>

    <!-- ========================================= -->
    <!-- TEXT -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Text (tv)</h2>

      <p :class="text({ size: 'sm' })">Small</p>
      <p :class="text({ size: 'md' })">Medium</p>
      <p :class="text({ size: 'lg' })">Large</p>
    </section>

    <!-- ========================================= -->
    <!-- ICON -->
    <!-- ========================================= -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold">Icon (tv)</h2>

      <div class="flex gap-4">
        <div :class="icon({ size: 'sm' }) " class="bg-gray-500"/>
        <div :class="icon({ size: 'md' }) " class="bg-gray-500"/>
        <div :class="icon({ size: 'lg' }) " class="bg-gray-500"/>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { button, input, textarea, badge, chip, card, dropdown, modal, text, icon, avatar } from '~/utils/ui/atoms'

const sizes = ['sm', 'md', 'lg']
const buttonVariants = ['primary', 'ghost', 'text', 'danger']

const loaderSizes = ['sm', 'md', 'lg', 'xl']
const loaderThemes = ['heavy', 'primary', 'muted', 'white']

const avatarSizes = ['sm', 'md', 'lg', 'xl', '2xl']
</script>