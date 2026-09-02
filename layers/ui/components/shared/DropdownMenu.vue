<template>
    <div class="relative inline-block" ref="triggerRef">
        <div @click.stop="toggle"
            class="w-max rounded-full px-2.5 py-2 sm:px-2 sm:py-1 hover:bg-gray-800 hover:text-white hover:brightness-75 flex items-center cursor-pointer select-none gap-1 text-gray-500 font-semibold text-sm transition-colors">
            <span class="text-gray-400 text-sm pointer-events-none">
                <AppIcon name="menuDots" class="text-icon-accent flex size-5 sm:size-4" />
            </span>
        </div>
    </div>

    <Teleport to="body">
        <TransitionFade>
            <div v-if="isOpen" ref="dropdownRef" :style="dropdownStyle"
                :class="[dropdown().menu(), 'z-[60] w-52 sm:w-40']">
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
// Отступы от границ экрана и разрыв между триггером и меню.
const GAP = 6

const open = () => {
    isOpen.value = true
    nextTick(() => {
        if (!triggerRef.value || !dropdownRef.value) return
        const rect = triggerRef.value.getBoundingClientRect()
        const menu = dropdownRef.value.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const w = menu.width
        const h = menu.height

        // Вертикаль: по умолчанию под триггером; если снизу не влезает — открываем вверх.
        let top = rect.bottom + GAP
        if (top + h > vh - GAP) top = Math.max(GAP, rect.top - h - GAP)

        // Горизонталь: под левым краем триггера, но не вылезаем за правый/левый край экрана.
        let left = rect.left
        if (left + w > vw - GAP) left = Math.max(GAP, vw - w - GAP)
        if (left < GAP) left = GAP

        dropdownStyle.value = { position: 'fixed', top: `${top}px`, left: `${left}px` }
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

// Закрытие по клику вне меню и триггера (нужно и на таче, где нет mousemove).
const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as Node
    if (triggerRef.value?.contains(target)) return
    if (dropdownRef.value?.contains(target)) return
    close()
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

// Прокрутка (в т.ч. внутри модалки) должна закрывать открытое меню.
const handleScroll = () => close()

watch(isOpen, (val) => {
    if (val) {
        document.addEventListener("click", handleGlobalClick)
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("wheel", handleWheel, { passive: true })
        document.addEventListener("scroll", handleScroll, { passive: true, capture: true })
    } else {
        document.removeEventListener("click", handleGlobalClick)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("wheel", handleWheel)
        document.removeEventListener("scroll", handleScroll, { capture: true })
    }
})

onBeforeUnmount(() => {
    document.removeEventListener("click", handleGlobalClick)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("wheel", handleWheel)
    document.removeEventListener("scroll", handleScroll, { capture: true })
})

provide("menuClose", close)
</script>
