<script setup lang="ts">
/** Lista agrupada con esquinas redondeadas, como las de Ajustes. */
defineProps<{ title?: string; footer?: string }>()
</script>

<template>
  <section class="mb-7">
    <h2 v-if="title" class="section-title">{{ title }}</h2>
    <div class="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
      <slot />
    </div>
    <p v-if="footer" class="px-4 pt-2 text-[0.8125rem] text-ink-2">{{ footer }}</p>
  </section>
</template>
