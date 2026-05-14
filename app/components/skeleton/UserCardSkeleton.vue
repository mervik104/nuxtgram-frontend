<template>
    <div class="flex-1 w-full flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <USkeleton class="h-7 w-28" />
            <USkeleton class="h-5 w-20" />
            <div class="sm:ml-auto">
                <USkeleton class="h-8 w-32" />
            </div>
        </div>
        <USkeleton class="h-4 w-56" />
        <div class="flex gap-2 mt-1 flex-wrap">
            <USkeleton class="h-7 w-24 rounded-full" />
            <USkeleton class="h-7 w-28 rounded-full" />
            <USkeleton class="h-7 w-24 rounded-full" />
        </div>
    </div>
</template>