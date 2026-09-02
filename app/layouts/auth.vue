<template>
    <div class="h-screen flex flex-col overflow-hidden bg-surface-background text-icon-primary">
        <!-- Placeholder для Smart CAPTCHA (Cloudflare Turnstile). Кастомный
             флоу Clerk ищет #clerk-captcha в DOM до signUp.create()/signIn.create().
             Виджет рендерится только когда Clerk заподозрит бота. -->
        <div id="clerk-captcha" data-cl-theme="auto" data-cl-size="flexible" aria-hidden="true" />
        <slot />
    </div>
</template>

<script lang="ts" setup>

</script>