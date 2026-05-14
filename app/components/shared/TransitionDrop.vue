<script setup>
const props = defineProps({
  tag: { type: [String, Boolean], default: 'div' }
})
</script>

<template>
  <Transition v-if="!tag" name="nuxtgram">
    <slot />
  </Transition>

  <TransitionGroup
    v-else
    :tag="tag"
    name="nuxtgram"
    class="nuxtgram-transition-group"
  >
    <slot />
  </TransitionGroup>
</template>

<style scoped>
.nuxtgram-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.nuxtgram-enter-active {
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.nuxtgram-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.nuxtgram-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.nuxtgram-leave-active {
  transition: all 0.25s ease-in;
}
.nuxtgram-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.nuxtgram-transition-group > * {
  margin-bottom: 0.5rem;
}
</style>