<template>
    <span :class="chip({ size: 'md' }) + ' flex gap-2'">
        <span>{{ formatCompactNumber(stat) }}</span>
        <span>
            <slot></slot>
        </span>
    </span>
    
    <!-- <span><span class="font-medium text-gray-300">{{ formatCompactNumber(stat) }}</span> <slot></slot></span> -->
</template>

<script setup lang="ts">
import { chip } from '~/utils/ui/atoms';

const props = withDefaults(defineProps<{ stat: number }>(), { stat: 0 })

</script>