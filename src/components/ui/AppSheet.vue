<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { trapTab } from '@/composables/focusTrap'

/**
 * Hoja modal: sube desde abajo en móvil (con asa y gesto para cerrar) y es un diálogo centrado
 * en pantallas anchas. Cabecera con Cancelar a la izquierda y la acción principal a la derecha.
 */
const props = defineProps<{
  open: boolean
  title: string
  confirmLabel?: string
  confirmDisabled?: boolean
  busy?: boolean
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()
const { t } = useI18n()

const titleId = useId()
const panel = ref<HTMLElement>()
const dragY = ref(0)
let startY: number | null = null
let returnFocus: HTMLElement | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  trapTab(e, panel.value)
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      dragY.value = 0
      await nextTick()
      const target = panel.value?.querySelector<HTMLElement>('[autofocus]') ?? panel.value
      target?.focus()
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      returnFocus?.focus?.()
    }
  },
)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function dragStart(e: PointerEvent) {
  // Capturar el puntero sobre un botón de la cabecera se comería su clic.
  if ((e.target as HTMLElement).closest('button')) return
  startY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function dragMove(e: PointerEvent) {
  if (startY !== null) dragY.value = Math.max(0, e.clientY - startY)
}
function dragEnd() {
  if (dragY.value > 120) emit('close')
  dragY.value = 0
  startY = null
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/40" @click="emit('close')" />
    </Transition>
    <Transition
      enter-from-class="translate-y-full sm:translate-y-4 sm:opacity-0"
      leave-to-class="translate-y-full sm:translate-y-4 sm:opacity-0"
      enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-200 ease-in"
    >
      <div v-if="open" class="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <section
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="pointer-events-auto flex max-h-[92dvh] w-full flex-col rounded-t-[1.75rem] bg-canvas shadow-2xl outline-none sm:max-w-lg sm:rounded-[1.75rem]"
          :style="dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined"
        >
          <div class="touch-none select-none" @pointerdown="dragStart" @pointermove="dragMove" @pointerup="dragEnd" @pointercancel="dragEnd">
            <div class="mx-auto mt-2 h-1.5 w-9 rounded-full bg-ink-2/40 sm:hidden" aria-hidden="true" />
            <header class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 py-2">
              <button type="button" class="btn-plain justify-self-start font-normal" @click="emit('close')">{{ t('common.cancel') }}</button>
              <h2 :id="titleId" class="truncate text-center text-[1.0625rem] font-semibold">{{ title }}</h2>
              <button
                v-if="confirmLabel"
                type="button"
                class="btn-plain justify-self-end"
                :disabled="confirmDisabled || busy"
                @click="emit('confirm')"
              >
                {{ busy ? '…' : confirmLabel }}
              </button>
            </header>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6" style="padding-bottom: max(env(safe-area-inset-bottom), 1.5rem)">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
