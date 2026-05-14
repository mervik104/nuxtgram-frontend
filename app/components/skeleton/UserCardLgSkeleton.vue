<template>
    <div class="flex gap-4 items-center rounded-xl p-2 px-3 w-full">
        <USkeleton class="size-24 rounded-full shrink-0" />
        <div class="flex flex-col flex-1 gap-2">
            <div class="flex items-center gap-2">
                <USkeleton class="h-5 w-32" />
                <USkeleton class="h-8 w-24 rounded-lg ml-auto" />
            </div>
            <USkeleton class="h-3 w-40" />
            <USkeleton class="h-3 w-56" />
        </div>
    </div>
</template>