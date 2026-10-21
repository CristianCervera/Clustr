<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { pendingRequests } from '@/services/api'
import ClusterLoader from './ClusterLoader.vue'

/**
 * Aviso de carga mientras hay peticiones en curso. No sale en las rápidas (para que no parpadee) y,
 * una vez fuera, se queda un mínimo para que dé tiempo a verlo. Si tarda, lo dice.
 */
const SHOW_AFTER = 300
const MIN_VISIBLE = 600
const SLOW_AFTER = 4000

const { t } = useI18n()
const visible = ref(false)
const slow = ref(false)
let shownAt = 0
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
let slowTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => pendingRequests.value > 0,
  (busy) => {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    if (busy) {
      if (visible.value) return
      showTimer = setTimeout(() => {
        visible.value = true
        shownAt = Date.now()
        slowTimer = setTimeout(() => (slow.value = true), SLOW_AFTER - SHOW_AFTER)
      }, SHOW_AFTER)
    } else if (visible.value) {
      hideTimer = setTimeout(
        () => {
          visible.value = false
          slow.value = false
          clearTimeout(slowTimer)
        },
        Math.max(0, MIN_VISIBLE - (Date.now() - shownAt)),
      )
    }
  },
)
onBeforeUnmount(() => [showTimer, hideTimer, slowTimer].forEach(clearTimeout))
</script>

<template>
  <Transition
    enter-from-class="-translate-y-2 opacity-0"
    leave-to-class="-translate-y-2 opacity-0"
    enter-active-class="transition duration-200 ease-out"
    leave-active-class="transition duration-200 ease-in"
  >
    <div v-if="visible" class="glass flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-[0.875rem] font-medium text-ink shadow-card ring-1 ring-line">
      <ClusterLoader :size="26" />
      <span class="whitespace-nowrap">{{ slow ? t('common.slowRequest') : t('common.loading') }}</span>
    </div>
  </Transition>
</template>
