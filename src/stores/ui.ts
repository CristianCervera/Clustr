import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  tone: 'default' | 'error'
}

export interface ConfirmRequest {
  title: string
  message?: string
  confirmLabel: string
  destructive?: boolean
  resolve: (ok: boolean) => void
}

const SIDEBAR_KEY = 'clustr.sidebarHidden'

function readSidebarHidden() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

/** Avisos breves y diálogos de confirmación, compartidos por toda la app. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const confirmRequest = ref<ConfirmRequest | null>(null)
  // En escritorio la barra lateral se puede ocultar; se recuerda en este navegador.
  const sidebarHidden = ref(readSidebarHidden())
  let nextId = 1

  function toggleSidebar() {
    sidebarHidden.value = !sidebarHidden.value
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarHidden.value ? '1' : '0')
    } catch {
      // Sin almacenamiento se recuerda hasta recargar.
    }
  }

  function toast(message: string, tone: Toast['tone'] = 'default') {
    const id = nextId++
    toasts.value.push({ id, message, tone })
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function confirm(options: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
    confirmRequest.value?.resolve(false)
    return new Promise((resolve) => {
      confirmRequest.value = { ...options, resolve }
    })
  }

  function answer(ok: boolean) {
    confirmRequest.value?.resolve(ok)
    confirmRequest.value = null
  }

  return { toasts, confirmRequest, sidebarHidden, toast, dismiss, confirm, answer, toggleSidebar }
})
