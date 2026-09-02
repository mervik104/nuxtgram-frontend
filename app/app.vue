<template>
  <div class="min-h-screen">
    <UApp :toaster="{ position: 'top-right', max: 3 }">
      <NuxtLayout>
        <NuxtLoadingIndicator />
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>


<script setup lang="ts">
authBridge.value = useClerkAuth()
</script>