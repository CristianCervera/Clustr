<script setup lang="ts">
import LogoMark from './LogoMark.vue'

defineProps<{ title: string; body?: string }>()
</script>

<template>
  <div class="flex flex-col items-center px-8 py-14 text-center">
    <LogoMark :size="64" class="opacity-90" />
    <h2 class="mt-5 text-[1.25rem] font-semibold">{{ title }}</h2>
    <p v-if="body" class="mt-1.5 max-w-sm text-ink-2">{{ body }}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
