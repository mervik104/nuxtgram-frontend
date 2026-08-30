<template>
    <aside class="hidden lg:flex flex-col w-64 shrink-0 border-r border-border-sidebar overflow-y-auto p-5">
        <SidebarItem v-for="item in sidebarNav" :key="item.label" :to="item.to" :content="item.label">
            <AppIcon :name="item.icon" class="size-5" />
        </SidebarItem>

        <SidebarSubscriptions />
    </aside>
</template>

<script lang="ts" setup>
import { sidebarNav } from '~/data/navigation'

</script>