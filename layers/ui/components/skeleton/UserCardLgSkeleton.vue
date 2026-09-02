<template>
    <div class="flex gap-4 items-center rounded-xl p-2 px-3 w-full">
        <USkeleton class="size-24 max-sm:size-14 rounded-full shrink-0" />
        <div class="flex flex-col flex-1 min-w-0 gap-2 max-sm:gap-1.5">
            <div class="flex items-center gap-2">
                <USkeleton class="h-5 max-sm:h-3.5 w-32 max-sm:w-24" />
                <USkeleton class="h-8 max-sm:h-7 w-24 max-sm:w-20 rounded-lg ml-auto shrink-0" />
            </div>
            <USkeleton class="h-3 max-sm:h-2.5 w-40 max-sm:w-28" />
            <USkeleton class="h-3 max-sm:h-2.5 w-56 max-sm:w-40" />
        </div>
    </div>
</template>
