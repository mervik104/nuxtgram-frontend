<!-- layouts/default.vue -->
<template>
    <div class="h-screen flex flex-col bg-surface-background text-icon-primary">
        <AppHeader />
        <div class="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main id="app-scroller" class="flex-1 overflow-y-auto px-1.5 sm:px-3 pt-4 pb-28 sm:p-6 sm:pb-24 lg:pb-6">
                <slot />
                <AppFooter class="lg:hidden" />
            </main>
        </div>
        <AppTabbar />
    </div>
    <AppModals />
</template>

<script lang="ts" setup>
</script>