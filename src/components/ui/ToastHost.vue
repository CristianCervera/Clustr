<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import RequestIndicator from './RequestIndicator.vue'

const ui = useUiStore()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4"
    style="padding-top: max(env(safe-area-inset-top), 12px)"
    role="status"
    aria-live="polite"
  >
    <!-- El aviso de carga va en la misma columna que los mensajes: así no se pisan. -->
    <RequestIndicator />
    <TransitionGroup
      enter-from-class="-translate-y-3 opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-200"
    >
      <button
        v-for="toast in ui.toasts"
        :key="toast.id"
        type="button"
        class="pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-left text-[0.9375rem] font-medium shadow-card ring-1 ring-line"
        :class="toast.tone === 'error' ? 'bg-surface text-danger' : 'glass text-ink'"
        @click="ui.dismiss(toast.id)"
      >
        {{ toast.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
