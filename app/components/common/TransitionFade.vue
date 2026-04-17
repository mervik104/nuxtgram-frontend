<template>
    <transition enter-active-class="transition ease-out duration-100" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <slot></slot>
    </transition>
</template>
