<template>
  <div class="border-l border-[#424851] w-full transition-colors relative p-4 rounded-2xl">
    <div class="flex flex-col gap-3">
      <slot></slot>
    </div>
    <div class="w-[31px] left-[11px] rounded-2xl h-[0.3px] opacity-20 absolute bottom-0 bg-[#424851]"></div>
  </div>
</template>