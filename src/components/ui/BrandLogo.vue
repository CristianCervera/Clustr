<script setup lang="ts">
import LogoMark from './LogoMark.vue'

withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <div class="inline-flex items-center gap-2" role="img" aria-label="Clustr">
    <LogoMark :size="size === 'lg' ? 56 : 32" />
    <span
      class="font-display font-bold tracking-tight text-ink"
      :class="size === 'lg' ? 'text-[2.5rem] leading-none' : 'text-2xl leading-none'"
      aria-hidden="true"
      >Clustr</span
    >
  </div>
</template>
