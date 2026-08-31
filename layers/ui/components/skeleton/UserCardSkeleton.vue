<template>
    <!-- Мобилка: аватар + имя/ник/кнопка в ряд, статы-числа и описание под -->
    <div class="sm:hidden w-full">
        <div class="flex items-center gap-3">
            <USkeleton class="w-24 h-24 rounded-full shrink-0" />
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                    <USkeleton class="h-6 w-28" />
                    <USkeleton class="h-4 w-16" />
                </div>
                <div class="mt-2">
                    <USkeleton class="h-8 w-32 rounded-lg" />
                </div>
            </div>
        </div>

        <div class="flex gap-6 mt-4">
            <div class="flex flex-col items-center">
                <USkeleton class="h-5 w-5" />
                <USkeleton class="h-2.5 w-10 mt-1" />
            </div>
            <div class="flex flex-col items-center">
                <USkeleton class="h-5 w-5" />
                <USkeleton class="h-2.5 w-12 mt-1" />
            </div>
            <div class="flex flex-col items-center">
                <USkeleton class="h-5 w-5" />
                <USkeleton class="h-2.5 w-10 mt-1" />
            </div>
        </div>

        <USkeleton class="h-4 w-full mt-3" />
        <USkeleton class="h-4 w-3/4 mt-1" />
    </div>

    <!-- Десктоп: 2 колонки — аватар слева, вся информация справа -->
    <div class="hidden sm:flex sm:items-center sm:gap-6 w-full">
        <USkeleton class="w-36 h-36 rounded-full shrink-0" />

        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3 flex-wrap">
                <USkeleton class="h-7 w-32" />
                <USkeleton class="h-5 w-24" />
                <div class="ml-auto">
                    <USkeleton class="h-8 w-32 rounded-lg" />
                </div>
            </div>

            <USkeleton class="h-4 w-full mt-3" />
            <USkeleton class="h-4 w-2/3 mt-1" />

            <div class="flex gap-4 mt-3 flex-wrap">
                <USkeleton class="h-7 w-24 rounded-full" />
                <USkeleton class="h-7 w-28 rounded-full" />
                <USkeleton class="h-7 w-24 rounded-full" />
            </div>
        </div>
    </div>
</template>
