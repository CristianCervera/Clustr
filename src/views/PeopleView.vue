<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, FileUp, Link2, Plus } from 'lucide-vue-next'
import ImportSheet from '@/components/people/ImportSheet.vue'
import PersonSheet from '@/components/people/PersonSheet.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PersonAvatar from '@/components/ui/PersonAvatar.vue'
import SearchField from '@/components/ui/SearchField.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useErrorText } from '@/composables/useErrorText'
import { fullName, searchKey } from '@/services/people'
import { usePeopleStore } from '@/stores/people'
import type { Person } from '@/types'

const { t } = useI18n()
const store = usePeopleStore()
const errorText = useErrorText()

const query = ref('')
const filter = ref<'all' | 'single' | 'married' | 'occasional'>('all')
const editing = ref<Person | null>(null)
const personOpen = ref(false)
const importOpen = ref(false)
const loadError = ref('')

async function load() {
  loadError.value = ''
  try {
    await store.load()
  } catch (e) {
    loadError.value = errorText(e)
  }
}
onMounted(load)

const visible = computed(() => {
  const q = searchKey(query.value)
  return store.people.filter((p) => {
    if (filter.value === 'single' && p.married) return false
    if (filter.value === 'married' && !p.married) return false
    if (filter.value === 'occasional' && !p.occasional) return false
    return !q || searchKey(fullName(p)).includes(q)
  })
})

function details(p: Person): string {
  const spouse = p.spouseId ? store.byId.get(p.spouseId) : undefined
  // El vínculo primero: es lo que más importa al hacer grupos y lo primero que se cortaría.
  return [
    spouse ? t('marital.marriedTo', { name: spouse.firstName }) : p.married ? t('marital.married') : '',
    p.occasional ? t('attendance.occasional') : '',
    p.age !== null ? t('people.age', { n: p.age }) : '',
    p.gender ? t(`gender.${p.gender}`) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function openPerson(person: Person | null) {
  editing.value = person
  personOpen.value = true
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader :title="t('people.title')" :subtitle="store.loaded ? t('people.count', store.people.length) : undefined">
      <template #actions>
        <button type="button" class="btn-plain" @click="importOpen = true">
          <FileUp :size="20" aria-hidden="true" />
          <span class="hidden sm:inline">{{ t('people.import') }}</span>
          <span class="sr-only sm:hidden">{{ t('people.import') }}</span>
        </button>
        <button type="button" class="grid h-11 w-11 place-items-center rounded-full bg-accent-fill text-white shadow-card transition active:scale-95" :aria-label="t('people.addPerson')" @click="openPerson(null)">
          <Plus :size="22" aria-hidden="true" />
        </button>
      </template>
    </PageHeader>

    <div v-if="loadError" class="px-4 py-10 text-center">
      <p class="text-ink-2">{{ loadError }}</p>
      <button type="button" class="btn-secondary mt-4" @click="load">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="!store.loaded" class="space-y-2 px-4" aria-busy="true" :aria-label="t('common.loading')">
      <div v-for="i in 6" :key="i" class="h-16 animate-pulse rounded-2xl bg-surface" />
    </div>

    <EmptyState v-else-if="!store.people.length" :title="t('people.emptyTitle')" :body="t('people.emptyBody')">
      <button type="button" class="btn-primary" @click="openPerson(null)">
        <Plus :size="20" aria-hidden="true" />{{ t('people.addPerson') }}
      </button>
      <button type="button" class="btn-secondary" @click="importOpen = true">
        <FileUp :size="20" aria-hidden="true" />{{ t('people.importExcel') }}
      </button>
    </EmptyState>

    <template v-else>
      <div class="sticky top-0 z-20 space-y-2 bg-canvas/90 px-4 pb-3 pt-1 backdrop-blur" style="padding-top: max(env(safe-area-inset-top), 4px)">
        <SearchField v-model="query" :placeholder="t('people.searchPlaceholder')" />
        <SegmentedControl
          v-model="filter"
          :label="t('people.title')"
          :options="[
            { value: 'all', label: t('people.filterAll') },
            { value: 'single', label: t('people.filterSingle') },
            { value: 'married', label: t('people.filterMarried') },
            { value: 'occasional', label: t('people.filterOccasional') },
          ]"
        />
      </div>

      <p v-if="!visible.length" class="px-4 py-10 text-center text-ink-2">{{ t('people.noResults', { q: query }) }}</p>

      <ul v-else class="mx-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li v-for="p in visible" :key="p.id">
          <button type="button" class="flex min-h-[64px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink/[0.03] active:bg-ink/5" @click="openPerson(p)">
            <PersonAvatar :person="p" />
            <span class="min-w-0 flex-1" :class="{ 'opacity-60': !p.active }">
              <span class="block truncate font-medium">{{ fullName(p) }}</span>
              <span class="flex items-center gap-1 truncate text-[0.875rem] text-ink-2">
                <Link2 v-if="p.spouseId" :size="14" class="shrink-0 text-teal-strong" aria-hidden="true" />
                {{ details(p) }}
              </span>
            </span>
            <span v-if="!p.active" class="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[0.75rem] font-medium text-ink-2">{{ t('people.inactive') }}</span>
            <ChevronRight :size="18" class="shrink-0 text-ink-2/60" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </template>

    <PersonSheet :open="personOpen" :person="editing" @close="personOpen = false" />
    <ImportSheet :open="importOpen" @close="importOpen = false" />
  </div>
</template>
