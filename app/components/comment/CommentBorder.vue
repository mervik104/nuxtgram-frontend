<template>
    <!-- need refactor -->
    <div class="ml-8 border-b border-l border-[#39425a] rounded-xl relative">
        <button v-if="!isPostVisible" @click="emit('close')" class="sticky top-2 left-0 -translate-x-1/2 z-20
                   w-6 h-6 rounded-full 
                   bg-[#1d2538] border border-[#39425a]
                   flex items-center justify-center
                   hover:bg-[#324465] hover:border-[#39425a] hover:scale-110
                   transition-all duration-200 cursor-pointer">
                <Cross class="w-[15px] h-[15px]"/>
        </button>
        <div @click.stop>
            <slot></slot>
        </div>
    </div>
</template>

<script setup>
const isPostVisible = defineModel({ required: true })
const emit = defineEmits(['close']);
</script>