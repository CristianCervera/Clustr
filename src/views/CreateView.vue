<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ChevronRight, Sparkles, Users } from 'lucide-vue-next'
import ParticipantsSheet from '@/components/groups/ParticipantsSheet.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListSection from '@/components/ui/ListSection.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import StepperControl from '@/components/ui/StepperControl.vue'
import SwitchRow from '@/components/ui/SwitchRow.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { estimateGroups } from '@/services/people'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PREFERENCES, useGroupsStore } from '@/stores/groups'
import { usePeopleStore } from '@/stores/people'
import { useUiStore } from '@/stores/ui'
import type { GroupPreferences } from '@/types'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const people = usePeopleStore()
const groups = useGroupsStore()
const ui = useUiStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

// Nombre del reparto: opcional; si se deja vacío se usa uno con la fecha.
const setName = ref('')
const defaultName = computed(() => t('groups.defaultName', { date: formatDate(new Date(), 'medium') }))

const prefs = reactive<GroupPreferences>({ ...DEFAULT_PREFERENCES, ...auth.user?.preferences })
watch(
  () => auth.user?.preferences,
  (saved) => saved && Object.assign(prefs, saved),
)

const loadError = ref('')
async function load() {
  loadError.value = ''
  try {
    await people.load()
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
/** Genera los grupos y los guarda directamente como un reparto con su nombre. */
async function generate() {
  generating.value = true
  try {
    const set = await groups.createSet({ ...prefs }, setName.value.trim() || defaultName.value)
    if (auth.user) auth.user.preferences = { ...prefs }
    setName.value = ''
    await router.push(`/groups/${set.id}`)
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    generating.value = false
  }
}

const participantsOpen = ref(false)
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="t('create.title')" />

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

    <div v-else class="px-4">
      <ListSection :title="t('groups.nameLabel')">
        <input v-model="setName" class="field !rounded-none !bg-transparent" autocomplete="off" maxlength="80" :placeholder="defaultName" :aria-label="t('groups.nameLabel')" />
      </ListSection>

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
        <SwitchRow v-model="prefs.spreadOccasional" :label="t('groups.spreadOccasional')" :hint="t('groups.spreadOccasionalHint')" />
        <SwitchRow v-model="prefs.balanceAge" :label="t('groups.balanceAge')" :hint="t('groups.balanceAgeHint')" />
      </ListSection>

      <button type="button" class="btn-primary mb-8 w-full !min-h-[52px] text-[1.0625rem]" :disabled="generating || participants.length < 2" @click="generate">
        <Sparkles :size="20" aria-hidden="true" />
        {{ generating ? t('groups.generating') : t('groups.generate') }}
      </button>
      <p v-if="participants.length < 2" class="-mt-6 mb-8 px-4 text-center text-[0.875rem] text-ink-2">{{ t('groups.notEnough') }}</p>
    </div>

    <ParticipantsSheet :open="participantsOpen" @close="participantsOpen = false" />
  </div>
</template>
