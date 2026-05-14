<template>
    <span :class="chip({ size: 'md' }) + ' flex gap-1'">
        <span>{{ formatCompactNumber(stat) }}</span>
        <span>
            <slot></slot>
        </span>
    </span>
</template>

<script setup lang="ts">
import { chip } from '~/utils/ui/atoms';

const props = withDefaults(defineProps<{ stat: number }>(), { stat: 0 })

</script>