<script setup lang="ts">
import { LOGO_ARC as arc, LOGO_BLUE, LOGO_NODES as nodes, LOGO_TEAL, LOGO_VIEWBOX } from './logoGeometry'

/** La «C» de nodos del logo de Clustr, en vectorial para que se vea bien en claro y en oscuro. */
defineProps<{ size?: number }>()
</script>

<template>
  <svg :width="size ?? 40" :height="size ?? 40" :viewBox="LOGO_VIEWBOX" aria-hidden="true">
    <path :d="arc" fill="none" :stroke="LOGO_TEAL" stroke-width="13" stroke-linecap="round" />
    <path :d="arc" fill="none" :stroke="LOGO_BLUE" stroke-width="4.5" stroke-linecap="round" />
    <g v-for="(n, i) in nodes" :key="i">
      <circle :cx="n.x" :cy="n.y" r="9" :fill="n.highlight ? LOGO_BLUE : LOGO_TEAL" />
      <circle :cx="n.x" :cy="n.y" r="5.6" :fill="n.highlight ? LOGO_TEAL : LOGO_BLUE" />
    </g>
  </svg>
</template>
