<template>
  <div class="w-full relative p-4 rounded-2xl border-l border-border-input transition-colors">
    <div class="flex flex-col gap-3">
      <slot></slot>
    </div>
    <div class="absolute bottom-0 left-3 w-[31px] h-[0.3px] rounded-2xl opacity-20 bg-border-input"></div>
  </div>
</template>