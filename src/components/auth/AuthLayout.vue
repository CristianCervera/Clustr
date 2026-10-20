<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { LOCALES, LOCALE_NAMES } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

defineProps<{ title: string }>()
const settings = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-dvh flex-col px-4" style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)">
    <div class="flex justify-end pt-3">
      <label class="relative inline-flex items-center gap-1.5 rounded-full px-3 text-[0.875rem] text-ink-2 hover:bg-ink/5">
        <Globe :size="16" aria-hidden="true" />
        <select v-model="settings.locale" class="min-h-[44px] cursor-pointer appearance-none bg-transparent pr-1 outline-none" :aria-label="t('profile.language')">
          <option v-for="code in LOCALES" :key="code" :value="code">{{ LOCALE_NAMES[code] }}</option>
        </select>
      </label>
    </div>
    <div class="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-16">
      <div class="mb-8 text-center">
        <BrandLogo size="lg" />
        <p class="mx-auto mt-4 max-w-[18rem] text-ink-2">{{ t('auth.tagline') }}</p>
      </div>
      <h1 class="mb-4 text-center text-[1.375rem] font-semibold">{{ title }}</h1>
      <slot />
    </div>
  </div>
</template>
