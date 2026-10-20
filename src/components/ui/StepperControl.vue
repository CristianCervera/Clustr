<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

/** Número con botones − y +. */
const props = withDefaults(defineProps<{ label: string; min?: number; max?: number }>(), { min: 1, max: 99 })
const model = defineModel<number>({ required: true })

const change = (delta: number) => (model.value = Math.min(props.max, Math.max(props.min, model.value + delta)))
</script>

<template>
  <div class="flex items-center gap-1" role="group" :aria-label="label">
    <button
      type="button"
      class="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-accent transition active:scale-95 disabled:opacity-40"
      :disabled="model <= min"
      :aria-label="`${label} −1`"
      @click="change(-1)"
    >
      <Minus :size="20" aria-hidden="true" />
    </button>
    <output class="min-w-[3ch] text-center text-[1.375rem] font-semibold tabular-nums" aria-live="polite">{{ model }}</output>
    <button
      type="button"
      class="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-accent transition active:scale-95 disabled:opacity-40"
      :disabled="model >= max"
      :aria-label="`${label} +1`"
      @click="change(1)"
    >
      <Plus :size="20" aria-hidden="true" />
    </button>
  </div>
</template>
