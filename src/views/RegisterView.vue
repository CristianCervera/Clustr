<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const errorText = useErrorText()

const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await auth.register(name.value, email.value, password.value)
    await router.replace('/people')
  } catch (e) {
    error.value = errorText(e, { CONFLICT: 'auth.emailTaken' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.registerTitle')">
    <form class="flex flex-col gap-3" novalidate @submit.prevent="submit">
      <input v-model="name" class="field" autocomplete="name" required :placeholder="t('auth.name')" :aria-label="t('auth.name')" />
      <input v-model="email" class="field" type="email" autocomplete="email" inputmode="email" required :placeholder="t('auth.email')" :aria-label="t('auth.email')" />
      <div>
        <input
          v-model="password"
          class="field"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          :placeholder="t('auth.password')"
          :aria-label="t('auth.password')"
          aria-describedby="password-hint"
        />
        <p id="password-hint" class="px-1 pt-1.5 text-[0.8125rem]" :class="password && password.length < 8 ? 'text-danger' : 'text-ink-2'">
          {{ t('auth.passwordHint') }}
        </p>
      </div>
      <p v-if="error" class="px-1 text-[0.875rem] text-danger" role="alert">{{ error }}</p>
      <button class="btn-primary mt-2 w-full" :disabled="busy || !name.trim() || !email || password.length < 8">{{ t('auth.register') }}</button>
    </form>
    <GoogleButton />
    <p class="mt-8 text-center text-ink-2">
      {{ t('auth.haveAccount') }}
      <RouterLink to="/login" class="font-semibold text-accent">{{ t('auth.login') }}</RouterLink>
    </p>
  </AuthLayout>
</template>
