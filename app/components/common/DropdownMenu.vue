<script setup lang="ts">
import { ref, watch, onBeforeUnmount, provide, nextTick } from "vue";

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<HTMLDivElement | null>(null); 
const dropdownStyle = ref<Record<string, string>>({});
const DISTANCE_LIMIT = 50;

const open = () => {
    isOpen.value = true;
    nextTick(() => {
        if (!triggerRef.value) return;
        const rect = triggerRef.value.getBoundingClientRect();
        dropdownStyle.value = {
            position: 'fixed',
            top: `${rect.bottom + 4}px`,
            left: `${rect.left}px`,
            zIndex: '9999'
        };
    });
};

const close = () => (isOpen.value = false);

const toggle = () => {
    if (isOpen.value) {
        close();
    } else {
        open();
    }
};

const handleMouseMove = (e: MouseEvent) => {
    if (!dropdownRef.value) return;
    const rect = dropdownRef.value.getBoundingClientRect();
    const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
    const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > DISTANCE_LIMIT) close();
};

watch(isOpen, (val) => {
    if (val) {
        document.addEventListener("mousemove", handleMouseMove);
    } else {
        document.removeEventListener("mousemove", handleMouseMove);
    }
});

onBeforeUnmount(() => {
    document.removeEventListener("mousemove", handleMouseMove);
});

provide("menuClose", close);
</script>

<template>
    <div class="relative inline-block" ref="triggerRef">
        <div @click.stop="toggle"
            class="w-max rounded-full px-2 py-1 hover:bg-gray-800 hover:text-white hover:brightness-75 flex items-center cursor-pointer select-none gap-1 text-gray-500 font-semibold text-sm">
            <button class="text-gray-400 transition-colors text-sm">
                ⋯
            </button>
        </div>
    </div>

    <Teleport to="body">
        <TransitionFade>
            <div v-if="isOpen" 
                 ref="dropdownRef" 
                 :style="dropdownStyle"
                 class="w-40 bg-[#1E2225] border border-[#2A2F33] rounded-lg shadow-lg overflow-hidden">
                <slot />
            </div>
        </TransitionFade>
    </Teleport>
</template>