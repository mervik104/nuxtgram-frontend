<template>
    <div class="mb-4 w-full relative p-4 rounded-2xl border-l border-border-input">
        <div class="flex flex-col gap-2">
            <!-- Шапка: аватар + имя + дата -->
            <div class="flex items-center gap-3">
                <USkeleton class="size-10 rounded-full shrink-0" />
                <div class="flex flex-col gap-1.5">
                    <USkeleton class="h-4 w-24" />
                    <USkeleton class="h-3 w-16" />
                </div>
            </div>

            <!-- Текст поста -->
            <div class="flex flex-col gap-1.5 pl-2 mt-1">
                <USkeleton class="h-3.5 w-full" />
                <USkeleton class="h-3.5 w-4/5" />
                <USkeleton class="h-3.5 w-2/3" />
            </div>

            <!-- Кнопки действий -->
            <div class="flex gap-1 mt-1">
                <USkeleton class="h-8 w-12 rounded-full" />
                <USkeleton class="h-8 w-12 rounded-full" />
                <USkeleton class="h-8 w-8 rounded-full" />
            </div>
        </div>
    </div>
</template>