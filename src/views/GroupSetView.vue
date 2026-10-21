<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ChevronLeft, Crown, Ellipsis, Pencil, RefreshCw, Trash2 } from 'lucide-vue-next'
import ExportMenu from '@/components/groups/ExportMenu.vue'
import GroupGrid from '@/components/groups/GroupGrid.vue'
import GroupNameSheet from '@/components/groups/GroupNameSheet.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import MenuButton from '@/components/ui/MenuButton.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { fullName, type GroupMember } from '@/services/people'
import { moveMember, spouseIn, useGroupsStore } from '@/stores/groups'
import { useUiStore } from '@/stores/ui'
import type { GroupSet, Member } from '@/types'

/** Un reparto guardado: se retoca (mover personas, nombres, volver a generar), se exporta o se borra. */
const props = defineProps<{ id: string }>()
const { t } = useI18n()
const router = useRouter()
const store = useGroupsStore()
const ui = useUiStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

const set = ref<GroupSet | null>(null)
const error = ref('')

// La vista se reutiliza al saltar de un reparto a otro (p. ej. al crear uno por cabezas): se recarga con el id.
watch(
  () => props.id,
  async (id) => {
    set.value = null
    error.value = ''
    try {
      set.value = await store.getSet(id)
    } catch (e) {
      error.value = errorText(e, { NOT_FOUND: 'groups.notFound', VALIDATION: 'groups.notFound' })
    }
  },
  { immediate: true },
)

const date = computed(() => new Date(set.value?.createdAt ?? Date.now()))
const groupLabel = (i: number) => set.value?.groupNames[i] || t('groups.group', { n: i + 1 })

/** Guarda un cambio del reparto y muestra el resultado. */
async function update(change: (current: GroupSet) => Promise<GroupSet>) {
  if (!set.value) return false
  try {
    set.value = await change(set.value)
    return true
  } catch (e) {
    ui.toast(errorText(e), 'error')
    return false
  }
}

// Volver a generar con las mismas personas y criterios.
const generating = ref(false)
const generation = ref(0)
async function regenerate() {
  const hasHeads = set.value?.groups.flat().some((m) => m.head)
  const ok = await ui.confirm({
    title: t('groups.regenerateTitle'),
    message: t(hasHeads ? 'groups.regenerateHeadsBody' : 'groups.regenerateBody'),
    confirmLabel: t('groups.regenerate'),
  })
  if (!ok) return
  generating.value = true
  if (await update((current) => store.regenerateSet(current))) generation.value++
  generating.value = false
}

// Mover a una persona a otro grupo.
const moving = ref<{ member: Member; from: number } | null>(null)
function select(member: GroupMember, from: number) {
  moving.value = { member: member as Member, from }
}
async function moveTo(index: number) {
  const target = moving.value
  if (!target || !set.value) return
  moving.value = null
  // Si su cónyuge está en el reparto (y no ya en ese grupo), se pregunta si va con él.
  const couple = spouseIn(set.value, target.member)
  let members = [target.member]
  if (couple && couple.group !== index) {
    const both = await ui.confirm({
      title: t('groups.moveSpouseTitle', { name: couple.spouse.firstName }),
      message: t('groups.moveSpouseBody', { a: target.member.firstName, b: couple.spouse.firstName, group: groupLabel(index) }),
      confirmLabel: t('groups.moveBoth'),
      cancelLabel: t('groups.moveOnly', { name: target.member.firstName }),
    })
    if (both === null) return
    if (both) members = [target.member, couple.spouse]
  }
  await update((current) => store.updateSet(current.id, moveMember(current, members, index)))
}

// Nombre de un grupo.
const renamingGroup = ref<number | null>(null)
const renamingGroupBusy = ref(false)
async function renameGroup(name: string) {
  const index = renamingGroup.value
  if (index === null) return
  renamingGroupBusy.value = true
  const groupNames = (current: GroupSet) => current.groups.map((_, i) => (i === index ? name : (current.groupNames[i] ?? '')))
  if (await update((current) => store.updateSet(current.id, { groupNames: groupNames(current) }))) renamingGroup.value = null
  renamingGroupBusy.value = false
}

// Nombre del reparto.
const renameOpen = ref(false)
const newName = ref('')
const renaming = ref(false)
async function rename() {
  if (!newName.value.trim()) return
  renaming.value = true
  if (await update((current) => store.updateSet(current.id, { name: newName.value.trim() }))) renameOpen.value = false
  renaming.value = false
}

// Repartir por cabezas: los miembros de un grupo encabezan cada uno un grupo nuevo con el resto.
const headsOpen = ref(false)
const creatingHeads = ref(false)
const total = computed(() => set.value?.groups.flat().length ?? 0)
// Se pregunta si los matrimonios se separan; parte del criterio que ya tiene el reparto.
const headsCouples = ref<'together' | 'apart'>('together')
function openHeads() {
  headsCouples.value = set.value?.preferences.couples === 'apart' ? 'apart' : 'together'
  headsOpen.value = true
}
/** Grupos que saldrían: con los matrimonios juntos, un matrimonio del grupo encabeza uno solo. */
const headsCount = (group: Member[]) =>
  headsCouples.value === 'apart' ? group.length : group.length - group.filter((m) => m.spouseId && group.some((o) => o.personId === m.spouseId)).length / 2
const canLead = (group: Member[]) => group.length >= 2 && total.value > group.length && headsCount(group) >= 2
async function createHeads(index: number) {
  if (!set.value) return
  creatingHeads.value = true
  try {
    const created = await store.createHeadsSet(set.value.id, index, t('groups.headsSetName', { name: set.value.name }).slice(0, 80), headsCouples.value)
    headsOpen.value = false
    ui.toast(t('groups.headsCreated'))
    await router.push(`/groups/${created.id}`)
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    creatingHeads.value = false
  }
}

async function remove() {
  if (!set.value) return
  const ok = await ui.confirm({
    title: t('groups.deleteSetTitle', { name: set.value.name }),
    message: t('groups.deleteSetBody'),
    confirmLabel: t('common.delete'),
    destructive: true,
  })
  if (!ok) return
  try {
    await store.removeSet(set.value.id)
    ui.toast(t('groups.deletedSet'))
    await router.replace('/groups')
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}

const menu = computed(() => [
  {
    label: t('groups.rename'),
    icon: Pencil,
    action: () => {
      newName.value = set.value?.name ?? ''
      renameOpen.value = true
    },
  },
  { label: t('groups.headsMenu'), icon: Crown, action: openHeads },
  { label: t('groups.deleteSet'), icon: Trash2, destructive: true, action: remove },
])
</script>

<template>
  <div class="mx-auto max-w-6xl px-4" style="padding-top: max(env(safe-area-inset-top), 0.75rem)">
    <nav class="flex items-center justify-between gap-2 pt-2">
      <RouterLink to="/groups" class="btn-plain -ml-3 min-w-0 !px-2 font-normal">
        <ChevronLeft :size="22" class="shrink-0" aria-hidden="true" /><span class="truncate">{{ t('groups.title') }}</span>
      </RouterLink>
      <div v-if="set" class="flex shrink-0 items-center gap-1">
        <button type="button" class="grid h-11 w-11 place-items-center rounded-full text-accent hover:bg-accent-soft" :aria-label="t('groups.regenerate')" :title="t('groups.regenerate')" :disabled="generating" @click="regenerate">
          <RefreshCw :size="20" :class="{ 'animate-spin': generating }" aria-hidden="true" />
        </button>
        <ExportMenu :groups="set.groups" :names="set.groupNames" :title="set.name" :date="date" />
        <MenuButton :items="menu" :label="t('common.more')">
          <span class="grid h-11 w-11 place-items-center rounded-full text-accent hover:bg-accent-soft"><Ellipsis :size="22" aria-hidden="true" /></span>
        </MenuButton>
      </div>
    </nav>

    <p v-if="error" class="py-16 text-center text-ink-2">{{ error }}</p>
    <div v-else-if="!set" class="mt-6 h-40 animate-pulse rounded-2xl bg-surface" :aria-label="t('common.loading')" />
    <template v-else>
      <header class="pb-5 pt-3">
        <h1 class="font-display text-[2.125rem] font-bold leading-tight tracking-tight">{{ set.name }}</h1>
        <p class="mt-0.5 text-ink-2">
          {{ t('groups.setSummary', { groups: set.groups.length, people: set.groups.flat().length }) }} · {{ formatDate(set.createdAt) }}
        </p>
      </header>
      <p class="mb-4 text-[0.875rem] text-ink-2">{{ t('groups.resultHint') }}</p>
      <GroupGrid :key="generation" :groups="set.groups" :names="set.groupNames" interactive renamable animate class="mb-8" @select="select" @rename="renamingGroup = $event" />
    </template>

    <AppSheet :open="Boolean(moving)" :title="moving ? t('groups.moveTitle', { name: fullName(moving.member) }) : ''" @close="moving = null">
      <ul v-if="moving && set" class="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li v-for="(group, i) in set.groups" :key="i">
          <button type="button" class="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left disabled:opacity-50" :disabled="i === moving.from" @click="moveTo(i)">
            <span class="truncate font-medium">{{ groupLabel(i) }}</span>
            <span class="shrink-0 text-[0.875rem] text-ink-2">{{ i === moving.from ? t('groups.currentGroup') : t('groups.members', group.length) }}</span>
          </button>
        </li>
      </ul>
    </AppSheet>

    <AppSheet :open="headsOpen" :title="t('groups.headsMenu')" @close="headsOpen = false">
      <p class="px-1 pb-3 pt-2 text-[0.9375rem] text-ink-2">{{ t('groups.headsIntro') }}</p>
      <h3 class="section-title">{{ t('groups.couples') }}</h3>
      <div class="mb-1 rounded-2xl bg-surface px-4 py-3">
        <SegmentedControl
          v-model="headsCouples"
          :label="t('groups.couples')"
          :options="[
            { value: 'together', label: t('groups.headsKeepCouples') },
            { value: 'apart', label: t('groups.headsSplitCouples') },
          ]"
        />
      </div>
      <p class="mb-5 px-4 text-[0.8125rem] text-ink-2">{{ headsCouples === 'together' ? t('groups.headsKeepCouplesHint') : t('groups.headsSplitCouplesHint') }}</p>
      <h3 class="section-title">{{ t('groups.headsChoose') }}</h3>
      <ul v-if="set" class="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li v-for="(group, i) in set.groups" :key="i">
          <button
            type="button"
            class="flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left disabled:opacity-50"
            :disabled="!canLead(group) || creatingHeads"
            @click="createHeads(i)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ groupLabel(i) }}</span>
              <span class="block truncate text-[0.875rem] text-ink-2">{{ group.map((m) => m.firstName).join(', ') }}</span>
            </span>
            <span class="shrink-0 text-[0.875rem] text-ink-2">
              {{ group.length < 2 ? t('groups.headsNeedTwo') : total <= group.length ? t('groups.headsNoRest') : headsCount(group) < 2 ? t('groups.headsOneGroup') : t('groups.headsResult', headsCount(group)) }}
            </span>
          </button>
        </li>
      </ul>
    </AppSheet>

    <GroupNameSheet
      :index="renamingGroup"
      :name="set && renamingGroup !== null ? (set.groupNames[renamingGroup] ?? '') : ''"
      :busy="renamingGroupBusy"
      @close="renamingGroup = null"
      @save="renameGroup"
    />

    <AppSheet :open="renameOpen" :title="t('groups.rename')" :confirm-label="t('common.save')" :confirm-disabled="!newName.trim()" :busy="renaming" @close="renameOpen = false" @confirm="rename">
      <form class="pt-2" @submit.prevent="rename">
        <label class="section-title block" for="rename">{{ t('groups.nameLabel') }}</label>
        <input id="rename" v-model="newName" class="field" maxlength="80" autofocus />
      </form>
    </AppSheet>
  </div>
</template>
