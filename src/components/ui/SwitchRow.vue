<script setup lang="ts">
import { useId } from 'vue'

/** Fila con etiqueta (y ayuda opcional) y un interruptor, como en Ajustes. */
defineProps<{ label: string; hint?: string }>()
const model = defineModel<boolean>({ required: true })
const id = useId()
</script>

<template>
  <label :for="id" class="flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-2.5">
    <span class="min-w-0 flex-1">
      <span class="block">{{ label }}</span>
      <span v-if="hint" class="block text-[0.8125rem] text-ink-2">{{ hint }}</span>
    </span>
    <span class="relative inline-flex shrink-0">
      <input :id="id" v-model="model" type="checkbox" role="switch" class="peer sr-only" />
      <span class="h-[31px] w-[51px] rounded-full bg-ink-2/30 transition-colors peer-checked:bg-teal peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2" />
      <span class="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
</template>
