import { useI18n } from 'vue-i18n'

/** Fecha larga en el idioma de la app: «20 de octubre de 2026». */
export function useFormatDate() {
  const { locale } = useI18n()
  return (date: Date | string, style: 'long' | 'medium' = 'long') =>
    new Intl.DateTimeFormat(locale.value, { dateStyle: style }).format(typeof date === 'string' ? new Date(date) : date)
}
