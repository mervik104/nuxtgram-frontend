<template>
    <div class="relative">
        <div class="w-full relative p-2 mb-2 rounded-2xl border-l border-border-accent transition-colors">
            <div class="flex flex-col gap-1">
                <slot></slot>
            </div>
        </div>
        <div class="absolute top-1/2 -translate-y-1/2 -left-4 w-4 h-px bg-border-accent"></div>
    </div>
</template>