import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import i18n, { isLocale, setLocale, type Locale } from '@/i18n'
import type { Theme } from '@/types'

const THEME_KEY = 'clustr.theme'

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // Almacenamiento bloqueado.
  }
  return 'system'
}

/** Idioma y apariencia. Funcionan sin sesión y se sincronizan con la cuenta al entrar. */
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(readTheme())
  const locale = ref<Locale>(i18n.global.locale.value as Locale)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemDark = ref(media.matches)
  media.addEventListener('change', (e) => (systemDark.value = e.matches))

  function applyTheme() {
    const dark = theme.value === 'dark' || (theme.value === 'system' && systemDark.value)
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0F1E' : '#F4F6FA')
  }

  watch([theme, systemDark], applyTheme, { immediate: true })
  watch(theme, (value) => {
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      // Sin almacenamiento la apariencia dura hasta recargar.
    }
  })
  watch(locale, (value) => setLocale(value), { immediate: true })

  /** Aplica lo guardado en la cuenta del usuario. */
  function adopt(user: { theme?: string; locale?: string }) {
    if (user.theme === 'light' || user.theme === 'dark' || user.theme === 'system') theme.value = user.theme
    if (isLocale(user.locale)) locale.value = user.locale
  }

  return { theme, locale, adopt }
})
