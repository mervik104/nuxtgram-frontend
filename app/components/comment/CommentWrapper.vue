<template>
    <!-- need refactor -->
    <div class="relative">
        <div class="border-l border-[#424851] w-full transition-colors relative p-2 rounded-2xl mb-2">
            <div class="flex flex-col gap-1">
                <slot></slot>
            </div>
        </div>
        <div class="absolute w-[16px] h-[1px] -left-[16px] bottom-[50%] bg-[#39425a]"></div>
    </div>
</template>