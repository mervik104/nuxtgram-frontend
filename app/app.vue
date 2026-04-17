<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10 }" />
    </NuxtLayout>
  </div>
</template>


<script setup lang="ts"></script>