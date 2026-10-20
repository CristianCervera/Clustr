<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const errorText = useErrorText()

const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    await auth.fetchMe()
    await router.replace((route.query.next as string) || '/groups')
  } catch (e) {
    error.value = errorText(e, { UNAUTHORIZED: 'auth.invalid' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.loginTitle')">
    <form class="flex flex-col gap-3" novalidate @submit.prevent="submit">
      <input v-model="email" class="field" type="email" autocomplete="email" inputmode="email" required :placeholder="t('auth.email')" :aria-label="t('auth.email')" />
      <input
        v-model="password"
        class="field"
        type="password"
        autocomplete="current-password"
        required
        :placeholder="t('auth.password')"
        :aria-label="t('auth.password')"
      />
      <p v-if="error" class="px-1 text-[0.875rem] text-danger" role="alert">{{ error }}</p>
      <button class="btn-primary mt-2 w-full" :disabled="busy || !email || !password">{{ t('auth.login') }}</button>
    </form>
    <GoogleButton />
    <p class="mt-8 text-center text-ink-2">
      {{ t('auth.noAccount') }}
      <RouterLink to="/register" class="font-semibold text-accent">{{ t('auth.register') }}</RouterLink>
    </p>
  </AuthLayout>
</template>
