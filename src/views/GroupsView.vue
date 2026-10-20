<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, RefreshCw, Sparkles, Users } from 'lucide-vue-next'
import ExportMenu from '@/components/groups/ExportMenu.vue'
import GroupGrid from '@/components/groups/GroupGrid.vue'
import ParticipantsSheet from '@/components/groups/ParticipantsSheet.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListSection from '@/components/ui/ListSection.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import StepperControl from '@/components/ui/StepperControl.vue'
import SwitchRow from '@/components/ui/SwitchRow.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { estimateGroups, fullName, type GroupMember } from '@/services/people'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PREFERENCES, useGroupsStore } from '@/stores/groups'
import { usePeopleStore } from '@/stores/people'
import { useUiStore } from '@/stores/ui'
import type { GroupPreferences, Person } from '@/types'

const { t } = useI18n()
const auth = useAuthStore()
const people = usePeopleStore()
const groups = useGroupsStore()
const ui = useUiStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

const prefs = reactive<GroupPreferences>({ ...DEFAULT_PREFERENCES, ...auth.user?.preferences })
watch(
  () => auth.user?.preferences,
  (saved) => saved && !groups.preview && Object.assign(prefs, saved),
)

const loadError = ref('')
async function load() {
  loadError.value = ''
  try {
    await Promise.all([people.load(), groups.loadSets()])
  } catch (e) {
    loadError.value = errorText(e)
  }
}
onMounted(load)

const participants = computed(() => people.people.filter((p) => p.active))
const maxValue = computed(() => Math.max(1, participants.value.length))
watch(maxValue, (max) => {
  if (prefs.value > max) prefs.value = max
})
const estimate = computed(() => estimateGroups(participants.value, prefs))

const generating = ref(false)
const generation = ref(0)
async function generate() {
  generating.value = true
  try {
    await groups.generate({ ...prefs })
    generation.value++
    if (auth.user) auth.user.preferences = { ...prefs }
    requestAnimationFrame(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    generating.value = false
  }
}

const participantsOpen = ref(false)

// Mover a una persona a otro grupo antes de guardar.
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
  saveName.value = t('groups.defaultName', { date: formatDate(new Date(), 'medium') })
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

const now = ref(new Date())
watch(generation, () => (now.value = new Date()))
const previewTitle = computed(() => t('groups.defaultName', { date: formatDate(now.value, 'medium') }))
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <PageHeader :title="t('groups.title')" />

    <div v-if="loadError" class="px-4 py-10 text-center">
      <p class="text-ink-2">{{ loadError }}</p>
      <button type="button" class="btn-secondary mt-4" @click="load">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="!people.loaded" class="space-y-3 px-4" aria-busy="true" :aria-label="t('common.loading')">
      <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-surface" />
    </div>

    <EmptyState v-else-if="people.people.length < 2" :title="t('groups.emptyTitle')" :body="t('groups.emptyBody')">
      <RouterLink to="/people" class="btn-primary"><Users :size="20" aria-hidden="true" />{{ t('groups.goToPeople') }}</RouterLink>
    </EmptyState>

    <div v-else class="grid gap-x-8 px-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <!-- Criterios -->
      <div class="lg:sticky lg:top-6 lg:self-start">
        <ListSection>
          <button type="button" class="flex min-h-[60px] w-full items-center gap-3 px-4 text-left" @click="participantsOpen = true">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-teal-soft text-teal-strong"><Users :size="20" aria-hidden="true" /></span>
            <span class="flex-1">
              <span class="block font-medium">{{ t('groups.participants') }}</span>
              <span class="block text-[0.875rem] text-ink-2">{{ t('groups.participantsCount', { active: participants.length, total: people.people.length }) }}</span>
            </span>
            <span class="text-accent">{{ t('groups.choose') }}</span>
            <ChevronRight :size="18" class="text-ink-2/60" aria-hidden="true" />
          </button>
        </ListSection>

        <ListSection :title="t('groups.criteria')" :footer="estimate.groups ? t('groups.estimate', { groups: estimate.groups, min: estimate.min, max: estimate.max }, estimate.min === estimate.max ? 1 : 2) : undefined">
          <div class="px-4 py-3">
            <SegmentedControl
              v-model="prefs.mode"
              :label="t('groups.criteria')"
              :options="[
                { value: 'count', label: t('groups.modeCount') },
                { value: 'size', label: t('groups.modeSize') },
              ]"
            />
          </div>
          <div class="flex min-h-[60px] items-center justify-between gap-3 px-4 py-2">
            <span>{{ prefs.mode === 'count' ? t('groups.groupsValue') : t('groups.sizeValue') }}</span>
            <StepperControl v-model="prefs.value" :label="prefs.mode === 'count' ? t('groups.modeCount') : t('groups.modeSize')" :max="maxValue" />
          </div>
        </ListSection>

        <ListSection :title="t('groups.couples')">
          <div class="px-4 py-3">
            <SegmentedControl
              v-model="prefs.couples"
              :label="t('groups.couples')"
              :options="[
                { value: 'together', label: t('groups.couplesTogether') },
                { value: 'apart', label: t('groups.couplesApart') },
                { value: 'any', label: t('groups.couplesAny') },
              ]"
            />
          </div>
        </ListSection>

        <ListSection>
          <SwitchRow v-model="prefs.balanceGender" :label="t('groups.balanceGender')" />
          <SwitchRow v-model="prefs.mixMarital" :label="t('groups.mixMarital')" />
          <SwitchRow v-model="prefs.balanceAge" :label="t('groups.balanceAge')" :hint="t('groups.balanceAgeHint')" />
        </ListSection>

        <button type="button" class="btn-primary mb-8 w-full !min-h-[52px] text-[1.0625rem]" :disabled="generating || participants.length < 2" @click="generate">
          <Sparkles :size="20" aria-hidden="true" />
          {{ generating ? t('groups.generating') : groups.preview ? t('groups.regenerate') : t('groups.generate') }}
        </button>
        <p v-if="participants.length < 2" class="-mt-6 mb-8 px-4 text-center text-[0.875rem] text-ink-2">{{ t('groups.notEnough') }}</p>
      </div>

      <!-- Resultado e historial -->
      <div class="min-w-0">
        <section v-if="groups.preview" id="result" class="mb-10 scroll-mt-4">
          <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-[1.375rem] font-bold">{{ t('groups.result') }}</h2>
            <div class="flex items-center gap-2">
              <button type="button" class="grid h-11 w-11 place-items-center rounded-full text-accent hover:bg-accent-soft" :aria-label="t('groups.regenerate')" :disabled="generating" @click="generate">
                <RefreshCw :size="20" :class="{ 'animate-spin': generating }" aria-hidden="true" />
              </button>
              <ExportMenu :groups="groups.preview" :title="previewTitle" :date="now" />
              <button type="button" class="btn-primary" @click="openSave">{{ t('groups.save') }}</button>
            </div>
          </div>
          <p class="mb-4 text-[0.875rem] text-ink-2">{{ t('groups.resultHint') }}</p>
          <GroupGrid :key="generation" :groups="groups.preview" interactive animate @select="select" />
        </section>

        <section>
          <h2 class="section-title">{{ t('groups.history') }}</h2>
          <p v-if="!groups.sets.length" class="rounded-2xl bg-surface px-4 py-6 text-center text-ink-2">{{ t('groups.historyEmpty') }}</p>
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
    </div>

    <ParticipantsSheet :open="participantsOpen" @close="participantsOpen = false" />

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
