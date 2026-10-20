import { useI18n } from 'vue-i18n'
import { ApiError } from '@/services/api'

/** Códigos del servidor con traducción propia. El resto usa el mensaje del servidor (en español). */
const CODES: Record<string, string> = {
  NETWORK: 'common.networkError',
  WRONG_PASSWORD: 'profile.wrongPassword',
  NOT_ENOUGH_PEOPLE: 'groups.notEnough',
}

export function useErrorText() {
  const { t, locale } = useI18n()
  return (error: unknown, fallbacks: Record<string, string> = {}): string => {
    if (error instanceof ApiError) {
      const key = fallbacks[error.code] ?? CODES[error.code]
      if (key) return t(key)
      if (locale.value === 'es' && error.message) return error.message
    }
    return t('common.genericError')
  }
}
