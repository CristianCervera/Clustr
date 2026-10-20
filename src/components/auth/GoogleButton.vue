<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { GOOGLE_CLIENT_ID, renderGoogleButton } from '@/services/google'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

/** Botón oficial de Google. No aparece si no hay VITE_GOOGLE_CLIENT_ID. */
const container = ref<HTMLElement>()
const { t, locale } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

async function render() {
  if (!GOOGLE_CLIENT_ID || !container.value) return
  container.value.innerHTML = ''
  try {
    await renderGoogleButton(container.value, {
      dark: document.documentElement.classList.contains('dark'),
      locale: locale.value,
      width: Math.min(container.value.clientWidth || 320, 400),
      onCredential: async (credential) => {
        try {
          await auth.loginWithGoogle(credential)
          await router.replace((router.currentRoute.value.query.next as string) || '/groups')
        } catch {
          ui.toast(t('auth.googleError'), 'error')
        }
      },
    })
  } catch {
    // Sin conexión con Google: el formulario de email sigue disponible.
  }
}

onMounted(render)
watch(locale, render)
</script>

<template>
  <template v-if="GOOGLE_CLIENT_ID">
    <div class="my-5 flex items-center gap-3 text-[0.8125rem] text-ink-2">
      <span class="h-px flex-1 bg-line" />{{ t('auth.or') }}<span class="h-px flex-1 bg-line" />
    </div>
    <div ref="container" class="flex min-h-[44px] justify-center" />
  </template>
</template>
