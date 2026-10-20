<script setup lang="ts" generic="T extends string">
/** Control segmentado: elección única entre pocas opciones mutuamente excluyentes. */
defineProps<{ options: { value: T; label: string }[]; label: string }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="flex rounded-[0.7rem] bg-surface-2 p-0.5">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      class="min-h-[36px] flex-1 rounded-[0.6rem] px-2 text-[0.875rem] font-medium transition"
      :class="model === opt.value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
