<script setup lang="ts">
import { LOGO_ARC as arc, LOGO_BLUE, LOGO_NODES, LOGO_TEAL, LOGO_VIEWBOX } from './logoGeometry'

/**
 * Loader de Clustr: lo que hace la app, con el logo. Los nodos llegan sueltos (personas), se agrupan
 * uno tras otro en la «C» y el hilo los une; luego se sueltan y vuelta a empezar.
 * Con «reducir movimiento» no viajan: se iluminan en orden a lo largo del hilo.
 */
defineProps<{ size?: number }>()

// Cada nodo llega desde fuera de la «C», un poco girado para que no parezca una explosión simétrica.
const nodes = LOGO_NODES.map((n, i) => {
  const a = n.angle + (i % 2 ? 0.6 : -0.6)
  return { ...n, dx: Math.cos(a) * 26, dy: Math.sin(a) * 26, delay: i * 70 }
})
</script>

<template>
  <svg class="cluster-loader" :width="size ?? 40" :height="size ?? 40" :viewBox="LOGO_VIEWBOX" aria-hidden="true" overflow="visible">
    <path class="thread" :d="arc" pathLength="1" fill="none" :stroke="LOGO_TEAL" stroke-width="13" stroke-linecap="round" />
    <path class="thread" :d="arc" pathLength="1" fill="none" :stroke="LOGO_BLUE" stroke-width="4.5" stroke-linecap="round" />
    <g
      v-for="(n, i) in nodes"
      :key="i"
      class="node"
      :style="{ '--dx': `${n.dx}px`, '--dy': `${n.dy}px`, animationDelay: `${n.delay}ms` }"
    >
      <circle :cx="n.x" :cy="n.y" r="9" :fill="n.highlight ? LOGO_BLUE : LOGO_TEAL" />
      <circle :cx="n.x" :cy="n.y" r="5.6" :fill="n.highlight ? LOGO_TEAL : LOGO_BLUE" />
    </g>
  </svg>
</template>

<style scoped>
/* Un ciclo de 2,4 s: llegan (0–35 %), se unen (35–55 %), quietos (55–75 %), se sueltan (75–100 %). */
.node {
  transform-box: fill-box;
  transform-origin: center;
  animation: cluster-gather 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite both;
}
.thread {
  stroke-dasharray: 1;
  animation: cluster-thread 2.4s ease-in-out infinite both;
}

@keyframes cluster-gather {
  0% {
    transform: translate(var(--dx), var(--dy)) scale(0.5);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  35%,
  75% {
    transform: none;
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(0.5);
    opacity: 0;
  }
}
@keyframes cluster-thread {
  0%,
  35% {
    stroke-dashoffset: 1;
  }
  55%,
  75% {
    stroke-dashoffset: 0;
  }
  95%,
  100% {
    stroke-dashoffset: -1;
  }
}

/*
 * La regla global de «reducir movimiento» corta todas las animaciones; aquí se sustituye por otra sin
 * desplazamiento, porque un loader parado no dice que algo está pasando.
 */
@media (prefers-reduced-motion: reduce) {
  .thread {
    animation: none !important;
    stroke-dasharray: none;
    opacity: 0.35;
  }
  .node {
    animation-name: cluster-glow !important;
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
    animation-timing-function: ease-in-out !important;
  }
}
@keyframes cluster-glow {
  0%,
  100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
</style>
