<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ChevronLeft, Ellipsis, Pencil, Trash2 } from 'lucide-vue-next'
import ExportMenu from '@/components/groups/ExportMenu.vue'
import GroupGrid from '@/components/groups/GroupGrid.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import MenuButton from '@/components/ui/MenuButton.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { useGroupsStore } from '@/stores/groups'
import { useUiStore } from '@/stores/ui'
import type { GroupSet } from '@/types'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const router = useRouter()
const store = useGroupsStore()
const ui = useUiStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

const set = ref<GroupSet | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    set.value = await store.getSet(props.id)
  } catch (e) {
    error.value = errorText(e, { NOT_FOUND: 'groups.notFound', VALIDATION: 'groups.notFound' })
  }
})

const date = computed(() => new Date(set.value?.createdAt ?? Date.now()))

const renameOpen = ref(false)
const newName = ref('')
const renaming = ref(false)
async function rename() {
  if (!set.value || !newName.value.trim()) return
  renaming.value = true
  try {
    set.value = await store.renameSet(set.value.id, newName.value.trim())
    renameOpen.value = false
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    renaming.value = false
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
  { label: t('groups.deleteSet'), icon: Trash2, destructive: true, action: remove },
])
</script>

<template>
  <div class="mx-auto max-w-6xl px-4" style="padding-top: max(env(safe-area-inset-top), 0.75rem)">
    <nav class="flex items-center justify-between gap-2 pt-2">
      <RouterLink to="/groups" class="btn-plain -ml-3 !px-2 font-normal">
        <ChevronLeft :size="22" aria-hidden="true" />{{ t('groups.title') }}
      </RouterLink>
      <div v-if="set" class="flex items-center gap-2">
        <ExportMenu :groups="set.groups" :title="set.name" :date="date" />
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
      <GroupGrid :groups="set.groups" />
    </template>

    <AppSheet :open="renameOpen" :title="t('groups.rename')" :confirm-label="t('common.save')" :confirm-disabled="!newName.trim()" :busy="renaming" @close="renameOpen = false" @confirm="rename">
      <form class="pt-2" @submit.prevent="rename">
        <label class="section-title block" for="rename">{{ t('groups.nameLabel') }}</label>
        <input id="rename" v-model="newName" class="field" maxlength="80" autofocus />
      </form>
    </AppSheet>
  </div>
</template>
