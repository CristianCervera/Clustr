<script setup lang="ts">
/** La «C» de nodos del logo de Clustr, en vectorial para que se vea bien en claro y en oscuro. */
defineProps<{ size?: number }>()

const center = { x: 54, y: 50 }
const r = 30
const nodes = [-40, -95, -140, 180, 140, 95, 40].map((deg, i) => {
  const a = (deg * Math.PI) / 180
  return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a), highlight: i === 1 || i === 5 }
})
const start = nodes[0]!
const end = nodes[nodes.length - 1]!
const arc = `M ${start.x} ${start.y} A ${r} ${r} 0 1 0 ${end.x} ${end.y}`
</script>

<template>
  <svg :width="size ?? 40" :height="size ?? 40" viewBox="12 9 77 82" aria-hidden="true">
    <path :d="arc" fill="none" stroke="#2DD4BF" stroke-width="13" stroke-linecap="round" />
    <path :d="arc" fill="none" stroke="#1478F0" stroke-width="4.5" stroke-linecap="round" />
    <g v-for="(n, i) in nodes" :key="i">
      <circle :cx="n.x" :cy="n.y" r="9" :fill="n.highlight ? '#1478F0' : '#2DD4BF'" />
      <circle :cx="n.x" :cy="n.y" r="5.6" :fill="n.highlight ? '#2DD4BF' : '#1478F0'" />
    </g>
  </svg>
</template>
