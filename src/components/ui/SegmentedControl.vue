<script setup lang="ts" generic="T extends string">
import { ref } from 'vue'

/** Control segmentado: elección única entre pocas opciones mutuamente excluyentes. */
const props = defineProps<{ options: { value: T; label: string }[]; label: string }>()
const model = defineModel<T>({ required: true })
const root = ref<HTMLElement>()

// Como un grupo de radios: una sola parada de Tab y las flechas cambian la opción.
function onKey(e: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!step) return
  e.preventDefault()
  const count = props.options.length
  const next = (props.options.findIndex((o) => o.value === model.value) + step + count) % count
  model.value = props.options[next]!.value
  root.value?.querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus()
}
</script>

<template>
  <div ref="root" role="radiogroup" :aria-label="label" class="flex rounded-[0.7rem] bg-surface-2 p-0.5" @keydown="onKey">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      :tabindex="model === opt.value ? 0 : -1"
      class="min-h-[36px] min-w-0 flex-1 rounded-[0.6rem] px-1 text-[0.8125rem] font-medium hyphens-auto transition-colors sm:px-2 sm:text-[0.875rem]"
      :class="model === opt.value ? 'bg-raised text-ink shadow-card' : 'text-ink-2 hover:text-ink'"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
