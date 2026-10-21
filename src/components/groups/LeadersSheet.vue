<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Link2 } from 'lucide-vue-next'
import AppSheet from '@/components/ui/AppSheet.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { fullName, searchKey } from '@/services/people'
import type { Person } from '@/types'

/** Elegir a mano a los responsables de grupo entre quienes participan. */
const props = defineProps<{ open: boolean; people: Person[] }>()
const emit = defineEmits<{ close: [] }>()
const chosen = defineModel<string[]>({ required: true })
const { t } = useI18n()
const query = ref('')

const visible = computed(() => {
  const q = searchKey(query.value)
  return q ? props.people.filter((p) => searchKey(fullName(p)).includes(q)) : props.people
})
const spouseName = (p: Person) => props.people.find((o) => o.id === p.spouseId)?.firstName

// Un matrimonio encabeza junto su grupo: marcar o desmarcar a uno hace lo mismo con su cónyuge.
function toggle(person: Person, on: boolean) {
  const ids = [person.id, ...(props.people.some((p) => p.id === person.spouseId) ? [person.spouseId!] : [])]
  chosen.value = on ? [...new Set([...chosen.value, ...ids])] : chosen.value.filter((c) => !ids.includes(c))
}
</script>

<template>
  <AppSheet :open="open" :title="t('groups.leadersTitle')" :confirm-label="t('common.done')" @close="emit('close')" @confirm="emit('close')">
    <div class="sticky top-0 z-10 space-y-3 bg-canvas pb-3 pt-1">
      <SearchField v-model="query" :placeholder="t('people.searchPlaceholder')" />
      <div class="flex items-center justify-between text-[0.9375rem]">
        <span class="text-ink-2">{{ t('groups.leadersChosen', chosen.length) }}</span>
        <button v-if="chosen.length" type="button" class="btn-plain !min-h-[36px]" @click="chosen = []">{{ t('groups.selectNone') }}</button>
      </div>
    </div>
    <ul class="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
      <li v-for="p in visible" :key="p.id">
        <label class="flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-1.5">
          <input type="checkbox" class="peer sr-only" :checked="chosen.includes(p.id)" @change="toggle(p, ($event.target as HTMLInputElement).checked)" />
          <span
            class="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink-2/40 text-white transition peer-checked:border-accent-fill peer-checked:bg-accent-fill peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
            aria-hidden="true"
          >
            <Check v-if="chosen.includes(p.id)" :size="14" :stroke-width="3" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ fullName(p) }}</span>
            <span v-if="spouseName(p)" class="flex items-center gap-1 text-[0.8125rem] text-ink-2">
              <Link2 :size="13" class="shrink-0 text-teal-strong" aria-hidden="true" />
              <span class="truncate">{{ t(`marital.marriedTo${p.gender === 'male' ? 'Male' : p.gender === 'female' ? 'Female' : ''}`, { name: spouseName(p) }) }}</span>
            </span>
          </span>
        </label>
      </li>
    </ul>
  </AppSheet>
</template>
