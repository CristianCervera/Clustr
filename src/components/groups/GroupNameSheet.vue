<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSheet from '@/components/ui/AppSheet.vue'

/** Cambiar el nombre de un grupo. Vacío vuelve a «Grupo N». */
const props = defineProps<{ index: number | null; name: string; busy?: boolean }>()
const emit = defineEmits<{ close: []; save: [name: string] }>()
const { t } = useI18n()

const value = ref('')
watch(
  () => props.index,
  (index) => {
    if (index !== null) value.value = props.name
  },
)
</script>

<template>
  <AppSheet :open="index !== null" :title="t('groups.renameGroup')" :confirm-label="t('common.save')" :busy="busy" @close="emit('close')" @confirm="emit('save', value.trim())">
    <form class="pt-2" @submit.prevent="emit('save', value.trim())">
      <label class="section-title block" for="group-name">{{ t('groups.groupNameLabel') }}</label>
      <input id="group-name" v-model="value" class="field" maxlength="40" :placeholder="index !== null ? t('groups.group', { n: index + 1 }) : ''" autofocus />
      <p class="mt-2 px-1 text-[0.875rem] text-ink-2">{{ t('groups.groupNameHint') }}</p>
    </form>
  </AppSheet>
</template>
