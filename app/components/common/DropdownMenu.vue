<template>
    <div class="relative inline-block" ref="triggerRef">
        <div @click.stop="toggle"
            class="w-max rounded-full px-2 py-1 hover:bg-gray-800 hover:text-white hover:brightness-75 flex items-center cursor-pointer select-none gap-1 text-gray-500 font-semibold text-sm transition-colors">
            <span class="text-gray-400 text-sm pointer-events-none">
                <BaseIcon name="menuDots" class="text-icon-access flex size-4" />
            </span>
        </div>
    </div>

    <Teleport to="body">
        <TransitionFade>
            <div v-if="isOpen" ref="dropdownRef" :style="dropdownStyle" :class="[dropdown().menu(), 'w-40']">
                <slot />
            </div>
        </TransitionFade>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, provide, nextTick } from "vue"
import { dropdown } from "~/utils/ui/atoms"

const isOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const DISTANCE_LIMIT = 70

const open = () => {
    isOpen.value = true
    nextTick(() => {
        if (!triggerRef.value) return
        const rect = triggerRef.value.getBoundingClientRect()
        dropdownStyle.value = {
            position: 'fixed',
            top: `${rect.bottom + 4}px`,
            left: `${rect.left}px`,
        }
    })
}

const close = () => (isOpen.value = false)

const toggle = () => {
    if (isOpen.value) {
        close()
    } else {
        open()
    }
}

const handleMouseMove = (e: MouseEvent) => {
    if (!dropdownRef.value) return
    const rect = dropdownRef.value.getBoundingClientRect()
    const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right)
    const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom)
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > DISTANCE_LIMIT) close()
}

const handleWheel = (e: WheelEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        close()
    }
}

watch(isOpen, (val) => {
    if (val) {
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("wheel", handleWheel, { passive: true })
    } else {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("wheel", handleWheel)
    }
})

onBeforeUnmount(() => {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("wheel", handleWheel)
})

provide("menuClose", close)
</script>