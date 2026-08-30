<template>
    <div class="flex flex-col lg:flex-row w-full min-h-full">
        <!-- Бренд-панель: только desktop/lg+, слева -->
        <aside class="hidden lg:flex lg:w-[42%] shrink-0 flex-col items-center justify-center gap-8 p-10 border-r border-border-subtle bg-surface-base">
            <slot name="brand" />
        </aside>

        <!-- Контент: бренд сверху (mobile) + форма -->
        <main class="flex-1 flex flex-col overflow-y-auto p-5 sm:p-8">
            <div class="my-auto w-full max-w-md mx-auto flex flex-col gap-5 sm:gap-6">
                <div class="lg:hidden flex justify-center">
                    <slot name="mobile-brand" />
                </div>
                <slot />
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>

</script>