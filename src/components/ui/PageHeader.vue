<script setup lang="ts">
/** Título grande al estilo iOS, con acciones de la vista a la derecha. */
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header class="flex items-end justify-between gap-3 px-4 pb-4 pt-6 lg:pt-10" style="padding-top: max(env(safe-area-inset-top), 1.5rem)">
    <div class="min-w-0">
      <h1 class="font-display text-[2.125rem] font-bold leading-tight tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="mt-0.5 text-ink-2">{{ subtitle }}</p>
    </div>
    <div class="flex shrink-0 items-center gap-1 pb-1">
      <slot name="actions" />
    </div>
  </header>
</template>
