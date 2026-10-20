<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{ placeholder: string }>()
const model = defineModel<string>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="relative">
    <Search :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
    <input v-model="model" type="search" :placeholder="placeholder" :aria-label="placeholder" class="field !rounded-[0.7rem] !py-2 pl-10 pr-10" />
    <button
      v-if="model"
      type="button"
      class="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-ink-2"
      :aria-label="t('common.close')"
      @click="model = ''"
    >
      <X :size="16" aria-hidden="true" />
    </button>
  </div>
</template>
