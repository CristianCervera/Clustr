<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronRight, RefreshCw, Sparkles } from 'lucide-vue-next'
import ExportMenu from '@/components/groups/ExportMenu.vue'
import GroupGrid from '@/components/groups/GroupGrid.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { fullName, type GroupMember } from '@/services/people'
import { useGroupsStore } from '@/stores/groups'
import { useUiStore } from '@/stores/ui'
import type { Person } from '@/types'

/** Grupos actuales (el último reparto generado, que se puede retocar y exportar) y repartos guardados. */
const { t } = useI18n()
const groups = useGroupsStore()
const ui = useUiStore()
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

const date = computed(() => groups.generatedAt ?? new Date())
const title = computed(() => t('groups.defaultName', { date: formatDate(date.value, 'medium') }))
const count = computed(() => groups.preview?.flat().length ?? 0)

const generating = ref(false)
const generation = ref(0)
async function regenerate() {
  if (!groups.previewPreferences) return
  generating.value = true
  try {
    await groups.generate({ ...groups.previewPreferences })
    generation.value++
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    generating.value = false
  }
}

// Mover a una persona a otro grupo.
const moving = ref<{ person: Person; from: number } | null>(null)
function select(member: GroupMember, from: number) {
  if ('id' in member) moving.value = { person: member, from }
}
function moveTo(index: number) {
  if (!moving.value) return
  groups.move(moving.value.person.id, index)
  moving.value = null
}

// Guardar el reparto.
const saveOpen = ref(false)
const saveName = ref('')
const saving = ref(false)
function openSave() {
  saveName.value = title.value
  saveOpen.value = true
}
async function save() {
  if (!saveName.value.trim()) return
  saving.value = true
  try {
    await groups.savePreview(saveName.value.trim())
    saveOpen.value = false
    ui.toast(t('groups.saved'))
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <PageHeader :title="t('groups.title')" :subtitle="groups.preview ? `${t('groups.setSummary', { groups: groups.preview.length, people: count })} · ${t('groups.generatedOn', { date: formatDate(date, 'medium') })}` : undefined">
      <template v-if="groups.preview" #actions>
        <button type="button" class="grid h-11 w-11 place-items-center rounded-full text-accent hover:bg-accent-soft" :aria-label="t('groups.regenerate')" :title="t('groups.regenerate')" :disabled="generating" @click="regenerate">
          <RefreshCw :size="20" :class="{ 'animate-spin': generating }" aria-hidden="true" />
        </button>
        <ExportMenu :groups="groups.preview" :title="title" :date="date" />
        <button v-if="groups.savedSetId" type="button" class="btn-secondary" disabled>
          <Check :size="18" aria-hidden="true" />{{ t('groups.savedShort') }}
        </button>
        <button v-else type="button" class="btn-primary" @click="openSave">{{ t('groups.save') }}</button>
      </template>
    </PageHeader>

    <div class="px-4">
      <section v-if="groups.preview" class="mb-10">
        <p class="mb-4 text-[0.875rem] text-ink-2">{{ t('groups.resultHint') }}</p>
        <GroupGrid :key="generation" :groups="groups.preview" interactive animate @select="select" />
      </section>

      <EmptyState v-else :title="t('groups.noCurrentTitle')" :body="t('groups.noCurrentBody')">
        <RouterLink to="/create" class="btn-primary"><Sparkles :size="20" aria-hidden="true" />{{ t('groups.generate') }}</RouterLink>
      </EmptyState>

      <section class="mb-8">
        <h2 class="section-title">{{ t('groups.history') }}</h2>
        <div v-if="loadError" class="rounded-2xl bg-surface px-4 py-6 text-center">
          <p class="text-ink-2">{{ loadError }}</p>
          <button type="button" class="btn-secondary mt-4" @click="load">{{ t('common.retry') }}</button>
        </div>
        <p v-else-if="!groups.sets.length" class="rounded-2xl bg-surface px-4 py-6 text-center text-ink-2">{{ t('groups.historyEmpty') }}</p>
        <ul v-else class="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
          <li v-for="set in groups.sets" :key="set.id">
            <RouterLink :to="`/groups/${set.id}`" class="flex min-h-[60px] items-center gap-3 px-4 py-2.5 hover:bg-ink/[0.03]">
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ set.name }}</span>
                <span class="block text-[0.875rem] text-ink-2">
                  {{ t('groups.setSummary', { groups: set.groups.length, people: set.groups.flat().length }) }} · {{ formatDate(set.createdAt, 'medium') }}
                </span>
              </span>
              <ChevronRight :size="18" class="text-ink-2/60" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

    <AppSheet :open="Boolean(moving)" :title="moving ? t('groups.moveTitle', { name: fullName(moving.person) }) : ''" @close="moving = null">
      <ul v-if="moving && groups.preview" class="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li v-for="(group, i) in groups.preview" :key="i">
          <button type="button" class="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left disabled:opacity-50" :disabled="i === moving.from" @click="moveTo(i)">
            <span class="font-medium">{{ t('groups.group', { n: i + 1 }) }}</span>
            <span class="text-[0.875rem] text-ink-2">{{ i === moving.from ? t('groups.currentGroup') : t('groups.members', group.length) }}</span>
          </button>
        </li>
      </ul>
    </AppSheet>

    <AppSheet :open="saveOpen" :title="t('groups.saveTitle')" :confirm-label="t('common.save')" :confirm-disabled="!saveName.trim()" :busy="saving" @close="saveOpen = false" @confirm="save">
      <form class="pt-2" @submit.prevent="save">
        <label class="section-title block" for="set-name">{{ t('groups.nameLabel') }}</label>
        <input id="set-name" v-model="saveName" class="field" maxlength="80" autofocus />
      </form>
    </AppSheet>
  </div>
</template>
