<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, FileSpreadsheet } from 'lucide-vue-next'
import AppSheet from '@/components/ui/AppSheet.vue'
import ListSection from '@/components/ui/ListSection.vue'
import SwitchRow from '@/components/ui/SwitchRow.vue'
import { useErrorText } from '@/composables/useErrorText'
import { downloadTemplate, readPeopleFile, type ParseResult } from '@/services/excel'
import { searchKey } from '@/services/people'
import { usePeopleStore } from '@/stores/people'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const store = usePeopleStore()
const ui = useUiStore()
const errorText = useErrorText()

const input = ref<HTMLInputElement>()
const fileName = ref('')
const result = ref<ParseResult | null>(null)
const reading = ref(false)
const busy = ref(false)
const replace = ref(false)
const error = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    result.value = null
    fileName.value = ''
    error.value = ''
    replace.value = false
  },
)

const count = computed(() => result.value?.rows.length ?? 0)

// En la vista previa cada matrimonio aparece en filas seguidas, como quedarán vinculados.
const previewRows = computed(() => {
  const rows = result.value?.rows ?? []
  const key = (name: string) => searchKey(name).replace(/\s+/g, ' ')
  const out: typeof rows = []
  const used = new Set<number>()
  rows.forEach((row, i) => {
    if (used.has(i)) return
    used.add(i)
    out.push(row)
    if (!row.spouseName) return
    const j = rows.findIndex((r, k) => !used.has(k) && key(`${r.firstName} ${r.lastName}`) === key(row.spouseName!))
    if (j >= 0) {
      used.add(j)
      out.push(rows[j]!)
    }
  })
  return out.slice(0, 8)
})

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  fileName.value = file.name
  reading.value = true
  error.value = ''
  result.value = null
  try {
    const parsed = await readPeopleFile(file)
    if (parsed.missingNameColumn) error.value = t('import.noNameColumn')
    else result.value = parsed
  } catch {
    error.value = t('import.invalidFile')
  } finally {
    reading.value = false
  }
}

async function confirm() {
  if (!result.value?.rows.length) return
  busy.value = true
  try {
    const res = await store.importRows(result.value.rows, replace.value)
    ui.toast(t('import.done', { created: res.created, couples: res.couples }))
    if (res.addedSpouses.length) ui.toast(t('import.addedSpouses', { names: res.addedSpouses.join(', ') }))
    emit('close')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppSheet
    :open="open"
    :title="t('import.title')"
    :confirm-label="count ? t('people.import') : undefined"
    :busy="busy"
    @close="emit('close')"
    @confirm="confirm"
  >
    <input ref="input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="hidden" @change="onFile" />

    <div v-if="!result" class="pt-2">
      <div class="mb-6 rounded-2xl bg-surface p-4">
        <p>{{ t('import.intro') }}</p>
        <ul class="mt-3 space-y-1 text-[0.9375rem]">
          <li class="font-semibold">{{ t('import.columnsRequired') }}</li>
          <li class="text-ink-2">{{ t('import.columnsOptional') }}</li>
        </ul>
        <p class="mt-3 border-l-2 border-teal pl-3 text-[0.875rem] text-ink-2">{{ t('import.spouseTip') }}</p>
      </div>
      <div class="flex flex-col gap-3">
        <button type="button" class="btn-primary w-full" :disabled="reading" @click="input?.click()">
          <FileSpreadsheet :size="20" aria-hidden="true" />
          {{ reading ? t('import.reading') : t('import.chooseFile') }}
        </button>
        <button type="button" class="btn-secondary w-full" @click="downloadTemplate(t)">
          <Download :size="20" aria-hidden="true" />
          {{ t('import.downloadTemplate') }}
        </button>
      </div>
    </div>

    <div v-else class="pt-2">
      <div class="mb-6 flex items-center gap-3 rounded-2xl bg-surface p-4">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal-strong">
          <FileSpreadsheet :size="22" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ fileName }}</p>
          <p class="text-[0.875rem] text-ink-2">{{ t('import.found', count) }}</p>
        </div>
      </div>

      <p v-if="result.skipped.length" class="mb-4 px-1 text-[0.875rem] text-danger">
        {{ t('import.rowErrors', result.skipped.length) }}:
        {{ result.skipped.slice(0, 8).map((row) => t('import.rowError', { row, message: t('import.missingName') })).join(' · ') }}
      </p>

      <ListSection v-if="store.people.length" :footer="t('import.replaceHint', { n: store.people.length })">
        <SwitchRow v-model="replace" :label="t('import.replace')" />
      </ListSection>

      <h3 class="section-title">{{ t('import.preview') }}</h3>
      <ul class="mb-6 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li v-for="(row, i) in previewRows" :key="i" class="flex items-baseline justify-between gap-3 px-4 py-2.5">
          <span class="truncate">{{ row.firstName }} {{ row.lastName }}</span>
          <span class="shrink-0 text-[0.8125rem] text-ink-2">
            {{ row.spouseName ? '⟷ ' + row.spouseName : row.phone || row.email }}
          </span>
        </li>
        <li v-if="count > 8" class="px-4 py-2.5 text-ink-2">+ {{ count - 8 }}</li>
      </ul>

      <button type="button" class="btn-primary w-full" :disabled="busy || !count" @click="confirm">{{ t('import.confirm', count) }}</button>
      <button type="button" class="btn-plain mt-2 w-full" @click="input?.click()">{{ t('import.otherFile') }}</button>
    </div>

    <p v-if="error" class="mt-4 px-1 text-[0.875rem] text-danger" role="alert">{{ error }}</p>
  </AppSheet>
</template>
