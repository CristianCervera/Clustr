import { createI18n } from 'vue-i18n'
import es from '@/locales/es.json'
import en from '@/locales/en.json'
import it from '@/locales/it.json'
import fr from '@/locales/fr.json'

export const LOCALES = ['es', 'en', 'it', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

/** Nombre de cada idioma en su propio idioma, para el selector. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
}

const STORAGE_KEY = 'clustr.locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Idioma guardado en el dispositivo o, si no hay, el del navegador. Español por defecto. */
export function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Almacenamiento bloqueado: se usa el idioma del navegador.
  }
  const browser = navigator.language?.slice(0, 2)
  return isLocale(browser) ? browser : 'es'
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'es',
  messages: { es, en, it, fr },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Sin almacenamiento el idioma dura hasta recargar.
  }
}

export default i18n
