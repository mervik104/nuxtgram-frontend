<template>
  <aside class="w-64 shrink-0 border-r border-gray-700/50 overflow-y-auto p-5">
    <SidebarItem to="/" content="Главная">
      <BaseIcon name="home" />
    </SidebarItem>
    <SidebarItem to="/feed" content="Лента">
      <BaseIcon name="home" />
    </SidebarItem>
    
    <SidebarSubscriptions />
  </aside>
</template>

<script lang="ts" setup>

</script>
