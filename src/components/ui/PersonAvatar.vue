<script setup lang="ts">
import { computed } from 'vue'
import { initials } from '@/services/people'

/** Iniciales sobre un tono de la marca. El color no transmite información: solo ayuda a distinguir. */
const props = defineProps<{ person: { firstName: string; lastName: string }; size?: number; picture?: string | null }>()

const TONES = ['bg-accent-soft text-accent', 'bg-teal-soft text-teal-strong']
const tone = computed(() => {
  const name = props.person.firstName + props.person.lastName
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return TONES[Math.abs(hash) % TONES.length]
})
</script>

<template>
  <img
    v-if="picture"
    :src="picture"
    alt=""
    referrerpolicy="no-referrer"
    class="shrink-0 rounded-full object-cover"
    :style="{ width: `${size ?? 40}px`, height: `${size ?? 40}px` }"
  />
  <span
    v-else
    class="grid shrink-0 place-items-center rounded-full font-semibold"
    :class="tone"
    :style="{ width: `${size ?? 40}px`, height: `${size ?? 40}px`, fontSize: `${(size ?? 40) * 0.38}px` }"
    aria-hidden="true"
    >{{ initials(person) }}</span
  >
</template>
