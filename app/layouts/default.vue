<template>
    <div class="h-screen flex flex-col bg-surface-background text-white">
        <AppHeader />
        <div class="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main id="app-scroller" class="flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>
    </div>
    <AppModals />
</template>

<script lang="ts" setup>

</script>