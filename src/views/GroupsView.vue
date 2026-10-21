<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Plus, Sparkles } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { useGroupsStore } from '@/stores/groups'
import type { GroupSet } from '@/types'

/** Repartos guardados, del más reciente al más antiguo: se elige uno para verlo y retocarlo. */
const { t } = useI18n()
const groups = useGroupsStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

const loadError = ref('')
async function load() {
  loadError.value = ''
  try {
    await groups.loadSets()
  } catch (e) {
    loadError.value = errorText(e)
  }
}
onMounted(load)

/** Nombres de los grupos para la vista previa de cada reparto. */
const groupLabels = (set: GroupSet) => set.groups.map((_, i) => set.groupNames[i] || t('groups.group', { n: i + 1 }))
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader :title="t('groups.title')">
      <template v-if="groups.sets.length" #actions>
        <RouterLink to="/create" class="btn-primary"><Plus :size="18" aria-hidden="true" />{{ t('groups.newSet') }}</RouterLink>
      </template>
    </PageHeader>

    <div class="px-4 pb-8">
      <div v-if="loadError" class="rounded-2xl bg-surface px-4 py-6 text-center">
        <p class="text-ink-2">{{ loadError }}</p>
        <button type="button" class="btn-secondary mt-4" @click="load">{{ t('common.retry') }}</button>
      </div>

      <div v-else-if="!groups.setsLoaded" class="space-y-3" aria-busy="true" :aria-label="t('common.loading')">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-surface" />
      </div>

      <EmptyState v-else-if="!groups.sets.length" :title="t('groups.noSetsTitle')" :body="t('groups.noSetsBody')">
        <RouterLink to="/create" class="btn-primary"><Sparkles :size="20" aria-hidden="true" />{{ t('groups.generate') }}</RouterLink>
      </EmptyState>

      <ul v-else class="space-y-3">
        <li v-for="set in groups.sets" :key="set.id">
          <RouterLink :to="`/groups/${set.id}`" class="flex items-center gap-3 rounded-[1.25rem] bg-surface p-4 shadow-card transition-colors hover:bg-ink/[0.02]">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[1.0625rem] font-semibold">{{ set.name }}</span>
              <span class="block text-[0.875rem] text-ink-2">
                {{ t('groups.setSummary', { groups: set.groups.length, people: set.groups.flat().length }) }} · {{ formatDate(set.createdAt, 'medium') }}
              </span>
              <span class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(label, i) in groupLabels(set).slice(0, 6)" :key="i" class="max-w-[12rem] truncate rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.8125rem] text-accent">{{ label }}</span>
                <span v-if="set.groups.length > 6" class="px-1 text-[0.8125rem] text-ink-2">+{{ set.groups.length - 6 }}</span>
              </span>
            </span>
            <ChevronRight :size="18" class="shrink-0 text-ink-2/60" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
