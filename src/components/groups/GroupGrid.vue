<script setup lang="ts">
import GroupCard from './GroupCard.vue'
import type { GroupMember } from '@/services/people'

defineProps<{ groups: GroupMember[][]; names?: string[]; interactive?: boolean; renamable?: boolean; animate?: boolean }>()
const emit = defineEmits<{ select: [member: GroupMember, group: number]; rename: [group: number] }>()
</script>

<template>
  <!-- Columnas según el ancho disponible, no el de la ventana: la rejilla vive junto a los criterios en escritorio. -->
  <div class="@container">
  <div class="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
    <GroupCard
      v-for="(group, i) in groups"
      :key="i"
      :index="i"
      :members="group"
      :name="names?.[i]"
      :interactive="interactive"
      :renamable="renamable"
      :class="animate ? 'cluster-in' : ''"
      :style="animate ? { animationDelay: `${Math.min(i, 8) * 60}ms` } : undefined"
      @select="(m) => emit('select', m, i)"
      @rename="emit('rename', i)"
    />
  </div>
  </div>
</template>
