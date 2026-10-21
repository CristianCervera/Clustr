<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { trapTab } from '@/composables/focusTrap'
import { useUiStore } from '@/stores/ui'

/** Alerta de confirmación para acciones destructivas. Cancelar es la opción por defecto. */
const ui = useUiStore()
const { t } = useI18n()
const cancelButton = ref<HTMLButtonElement>()
const dialog = ref<HTMLElement>()
// Al cerrar, el foco vuelve a lo que abrió la alerta (el botón Borrar, el menú…).
let returnFocus: HTMLElement | null = null

watch(
  () => ui.confirmRequest,
  async (req, previous) => {
    if (!req) {
      if (returnFocus?.isConnected) returnFocus.focus()
      returnFocus = null
      return
    }
    if (!previous) returnFocus = document.activeElement as HTMLElement | null
    await nextTick()
    cancelButton.value?.focus()
  },
)

// Las teclas se quedan en la alerta: si está sobre una hoja, Escape no debe cerrar también la hoja.
function onKeydown(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') ui.answer(false)
  trapTab(e, dialog.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0" enter-active-class="transition duration-200" leave-active-class="transition duration-150">
      <div v-if="ui.confirmRequest" class="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-6" @keydown="onKeydown">
        <div ref="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" class="w-full max-w-xs overflow-hidden rounded-[1.5rem] bg-surface text-center shadow-2xl">
          <div class="px-5 pb-4 pt-5">
            <h2 id="confirm-title" class="text-[1.0625rem] font-semibold">{{ ui.confirmRequest.title }}</h2>
            <p v-if="ui.confirmRequest.message" id="confirm-body" class="mt-1.5 text-[0.875rem] text-ink-2">{{ ui.confirmRequest.message }}</p>
          </div>
          <div class="grid grid-cols-2 border-t border-line">
            <button ref="cancelButton" type="button" class="min-h-[48px] border-r border-line text-accent" @click="ui.answer(false)">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="min-h-[48px] font-semibold"
              :class="ui.confirmRequest.destructive ? 'text-danger' : 'text-accent'"
              @click="ui.answer(true)"
            >
              {{ ui.confirmRequest.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
