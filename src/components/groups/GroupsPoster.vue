<script setup lang="ts">
import BrandLogo from '@/components/ui/BrandLogo.vue'
import GroupCard from './GroupCard.vue'
import type { GroupMember } from '@/services/people'

/** Composición que se exporta como imagen. Se pinta fuera de pantalla y siempre en claro. */
defineProps<{ groups: GroupMember[][]; names?: string[]; title: string; subtitle: string }>()
</script>

<template>
  <div class="light-scope bg-canvas p-12 font-sans" style="width: 1080px; font-size: 18px">
    <div class="mb-8 flex items-end justify-between gap-6">
      <div>
        <h1 class="font-display text-[44px] font-bold leading-tight tracking-tight">{{ title }}</h1>
        <p class="mt-1 text-ink-2">{{ subtitle }}</p>
      </div>
      <BrandLogo />
    </div>
    <div class="grid grid-cols-3 gap-4">
      <GroupCard v-for="(group, i) in groups" :key="i" :index="i" :members="group" :name="names?.[i]" class="!shadow-none" />
    </div>
  </div>
</template>
