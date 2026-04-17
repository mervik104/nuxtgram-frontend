<template>
    <div class="h-screen flex flex-col bg-[#101213] text-white">
        <TheHeader />
        <div class="flex flex-1 overflow-hidden">
            <TheSidebar />
            <main class="flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>
    </div>
    <ModalsContainer />
</template>

<script lang="ts" setup>

</script>