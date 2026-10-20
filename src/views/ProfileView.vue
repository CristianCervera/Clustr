<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Check, ChevronRight, Download, FileSpreadsheet, Globe, KeyRound, LogOut, Moon, Trash2, UserRound } from 'lucide-vue-next'
import AppSheet from '@/components/ui/AppSheet.vue'
import ListSection from '@/components/ui/ListSection.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PersonAvatar from '@/components/ui/PersonAvatar.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useErrorText } from '@/composables/useErrorText'
import { useFormatDate } from '@/composables/useFormatDate'
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n'
import { api } from '@/services/api'
import { downloadTemplate, exportPeople } from '@/services/excel'
import { useAuthStore } from '@/stores/auth'
import { usePeopleStore } from '@/stores/people'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import type { Stats, Theme } from '@/types'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const people = usePeopleStore()
const settings = useSettingsStore()
const ui = useUiStore()
const errorText = useErrorText()
const formatDate = useFormatDate()

const stats = ref<Stats | null>(null)
onMounted(async () => {
  stats.value = await api<Stats>('/auth/me/stats').catch(() => null)
})

const user = computed(() => auth.user)
const nameParts = computed(() => {
  const [first = '', ...rest] = (user.value?.name ?? '').split(' ')
  return { firstName: first, lastName: rest.join(' ') }
})

/** Idioma y tema se aplican al momento y se guardan en la cuenta en segundo plano. */
function persist(changes: { locale?: Locale; theme?: Theme }) {
  auth.update(changes).catch((e) => ui.toast(errorText(e), 'error'))
}
const theme = computed({
  get: () => settings.theme,
  set: (value: Theme) => {
    settings.theme = value
    persist({ theme: value })
  },
})
const languageOpen = ref(false)
function chooseLocale(code: Locale) {
  settings.locale = code
  languageOpen.value = false
  persist({ locale: code })
}

// Nombre
const nameOpen = ref(false)
const newName = ref('')
const busy = ref(false)
async function saveName() {
  if (!newName.value.trim()) return
  busy.value = true
  try {
    await auth.update({ name: newName.value.trim() })
    nameOpen.value = false
  } catch (e) {
    ui.toast(errorText(e), 'error')
  } finally {
    busy.value = false
  }
}

// Contraseña
const passwordOpen = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const passwordError = ref('')
function openPassword() {
  currentPassword.value = ''
  newPassword.value = ''
  passwordError.value = ''
  passwordOpen.value = true
}
async function savePassword() {
  if (newPassword.value.length < 8) return
  busy.value = true
  passwordError.value = ''
  try {
    await auth.changePassword(newPassword.value, user.value?.hasPassword ? currentPassword.value : undefined)
    passwordOpen.value = false
    ui.toast(t('profile.passwordChanged'))
  } catch (e) {
    passwordError.value = errorText(e)
  } finally {
    busy.value = false
  }
}

// Datos
async function exportList() {
  try {
    await people.load()
    await exportPeople(people.people, t)
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}
async function deleteAllPeople() {
  await people.load().catch(() => undefined)
  const ok = await ui.confirm({
    title: t('profile.deleteAllTitle', { n: people.people.length }),
    message: t('profile.deleteAllBody'),
    confirmLabel: t('common.delete'),
    destructive: true,
  })
  if (!ok) return
  try {
    await people.removeAll()
    if (stats.value) stats.value = { ...stats.value, people: 0, married: 0, couples: 0, occasional: 0, active: 0 }
    ui.toast(t('profile.deletedAll'))
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}

async function logout() {
  auth.logout()
  await router.replace('/login')
}
async function deleteAccount() {
  const ok = await ui.confirm({
    title: t('profile.deleteAccountTitle'),
    message: t('profile.deleteAccountBody'),
    confirmLabel: t('profile.deleteAccount'),
    destructive: true,
  })
  if (!ok) return
  try {
    await auth.deleteAccount()
    await router.replace('/login')
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}

const version = __APP_VERSION__
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="t('profile.title')" />

    <div v-if="user" class="px-4">
      <section class="mb-7 flex flex-col items-center text-center">
        <PersonAvatar :person="nameParts" :picture="user.picture" :size="88" />
        <h2 class="mt-3 text-[1.5rem] font-bold">{{ user.name }}</h2>
        <p class="text-ink-2">{{ user.email }}</p>
        <p class="mt-1 text-[0.8125rem] text-ink-2">{{ t('profile.memberSince', { date: formatDate(user.createdAt) }) }}</p>
      </section>

      <dl class="mb-7 grid grid-cols-3 gap-2">
        <div v-for="item in [
          { label: t('profile.statsPeople'), value: stats?.people },
          { label: t('profile.statsCouples'), value: stats?.couples },
          { label: t('profile.statsSets'), value: stats?.groupSets },
        ]" :key="item.label" class="rounded-2xl bg-surface px-2 py-3 text-center">
          <dd class="text-[1.5rem] font-bold tabular-nums">{{ item.value ?? '–' }}</dd>
          <dt class="text-[0.8125rem] text-ink-2">{{ item.label }}</dt>
        </div>
      </dl>

      <ListSection :title="t('profile.preferences')">
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" @click="languageOpen = true">
          <Globe :size="20" class="text-accent" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.language') }}</span>
          <span class="text-ink-2">{{ LOCALE_NAMES[settings.locale] }}</span>
          <ChevronRight :size="18" class="text-ink-2/60" aria-hidden="true" />
        </button>
        <div class="flex flex-col gap-2 px-4 py-3">
          <span class="flex items-center gap-3">
            <Moon :size="20" class="text-accent" aria-hidden="true" />
            {{ t('profile.appearance') }}
          </span>
          <SegmentedControl
            v-model="theme"
            :label="t('profile.appearance')"
            :options="[
              { value: 'system', label: t('profile.themeSystem') },
              { value: 'light', label: t('profile.themeLight') },
              { value: 'dark', label: t('profile.themeDark') },
            ]"
          />
        </div>
      </ListSection>

      <ListSection :title="t('profile.account')">
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" @click="(newName = user.name), (nameOpen = true)">
          <UserRound :size="20" class="text-accent" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.name') }}</span>
          <span class="max-w-[50%] truncate text-ink-2">{{ user.name }}</span>
          <ChevronRight :size="18" class="text-ink-2/60" aria-hidden="true" />
        </button>
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" @click="openPassword">
          <KeyRound :size="20" class="text-accent" aria-hidden="true" />
          <span class="flex-1">{{ user.hasPassword ? t('profile.changePassword') : t('profile.setPassword') }}</span>
          <ChevronRight :size="18" class="text-ink-2/60" aria-hidden="true" />
        </button>
        <div v-if="user.hasGoogle" class="flex min-h-[52px] items-center gap-3 px-4">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          <span class="flex-1">{{ t('profile.google') }}</span>
          <span class="flex items-center gap-1 text-teal-strong"><Check :size="16" aria-hidden="true" />{{ t('profile.googleLinked') }}</span>
        </div>
      </ListSection>

      <ListSection :title="t('profile.data')">
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" @click="exportList">
          <FileSpreadsheet :size="20" class="text-accent" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.exportPeople') }}</span>
        </button>
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left" @click="downloadTemplate(t)">
          <Download :size="20" class="text-accent" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.downloadTemplate') }}</span>
        </button>
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-danger" @click="deleteAllPeople">
          <Trash2 :size="20" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.deleteAllPeople') }}</span>
        </button>
      </ListSection>

      <ListSection>
        <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-danger" @click="logout">
          <LogOut :size="20" aria-hidden="true" />
          <span class="flex-1">{{ t('profile.logout') }}</span>
        </button>
      </ListSection>

      <button type="button" class="mx-auto mb-4 block min-h-[44px] px-4 text-[0.875rem] text-danger" @click="deleteAccount">{{ t('profile.deleteAccount') }}</button>
      <p class="pb-4 text-center text-[0.8125rem] text-ink-2">{{ t('profile.version', { v: version }) }}</p>
    </div>

    <AppSheet :open="languageOpen" :title="t('profile.language')" @close="languageOpen = false">
      <ul class="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-surface" role="listbox" :aria-label="t('profile.language')">
        <li v-for="code in LOCALES" :key="code" role="option" :aria-selected="settings.locale === code">
          <button type="button" class="flex min-h-[52px] w-full items-center justify-between px-4 text-left" :lang="code" @click="chooseLocale(code)">
            {{ LOCALE_NAMES[code] }}
            <Check v-if="settings.locale === code" :size="20" class="text-accent" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </AppSheet>

    <AppSheet :open="nameOpen" :title="t('profile.name')" :confirm-label="t('common.save')" :confirm-disabled="!newName.trim()" :busy="busy" @close="nameOpen = false" @confirm="saveName">
      <form class="pt-2" @submit.prevent="saveName">
        <input v-model="newName" class="field" autocomplete="name" maxlength="60" :aria-label="t('profile.name')" autofocus />
      </form>
    </AppSheet>

    <AppSheet
      :open="passwordOpen"
      :title="user?.hasPassword ? t('profile.changePassword') : t('profile.setPassword')"
      :confirm-label="t('common.save')"
      :confirm-disabled="newPassword.length < 8 || (user?.hasPassword && !currentPassword)"
      :busy="busy"
      @close="passwordOpen = false"
      @confirm="savePassword"
    >
      <form class="flex flex-col gap-3 pt-2" @submit.prevent="savePassword">
        <p v-if="!user?.hasPassword" class="px-1 text-[0.875rem] text-ink-2">{{ t('profile.setPasswordHint') }}</p>
        <input v-if="user?.hasPassword" v-model="currentPassword" class="field" type="password" autocomplete="current-password" :placeholder="t('profile.currentPassword')" :aria-label="t('profile.currentPassword')" autofocus />
        <div>
          <input v-model="newPassword" class="field" type="password" autocomplete="new-password" minlength="8" :placeholder="t('profile.newPassword')" :aria-label="t('profile.newPassword')" />
          <p class="px-1 pt-1.5 text-[0.8125rem] text-ink-2">{{ t('auth.passwordHint') }}</p>
        </div>
        <p v-if="passwordError" class="px-1 text-[0.875rem] text-danger" role="alert">{{ passwordError }}</p>
      </form>
    </AppSheet>
  </div>
</template>
