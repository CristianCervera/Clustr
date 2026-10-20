<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSheet from '@/components/ui/AppSheet.vue'
import ListSection from '@/components/ui/ListSection.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SwitchRow from '@/components/ui/SwitchRow.vue'
import { useErrorText } from '@/composables/useErrorText'
import { fullName } from '@/services/people'
import { usePeopleStore } from '@/stores/people'
import { useUiStore } from '@/stores/ui'
import type { Person, PersonInput } from '@/types'

const props = defineProps<{ open: boolean; person: Person | null }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const store = usePeopleStore()
const ui = useUiStore()
const errorText = useErrorText()

const empty = (): PersonInput => ({
  firstName: '',
  lastName: '',
  gender: null,
  age: null,
  married: false,
  spouseId: null,
  phone: '',
  email: '',
  notes: '',
  active: true,
})
const form = reactive<PersonInput>(empty())
const busy = ref(false)
const error = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const { id: _id, ...data } = props.person ?? { id: '', ...empty() }
    Object.assign(form, data)
    error.value = ''
  },
)

const gender = computed({
  get: () => form.gender ?? 'none',
  set: (v: 'male' | 'female' | 'none') => (form.gender = v === 'none' ? null : v),
})
const marital = computed({
  get: () => (form.married ? 'married' : 'single'),
  set: (v: 'single' | 'married') => {
    form.married = v === 'married'
    if (!form.married) form.spouseId = null
  },
})
const ageText = computed({
  get: () => (form.age === null ? '' : String(form.age)),
  set: (v: string) => {
    const n = Number.parseInt(v, 10)
    form.age = Number.isFinite(n) && n >= 0 && n <= 120 ? n : null
  },
})
const spouseOptions = computed(() => store.people.filter((p) => p.id !== props.person?.id))

async function save() {
  if (!form.firstName.trim()) return
  busy.value = true
  error.value = ''
  try {
    if (props.person) {
      await store.update(props.person.id, { ...form })
      ui.toast(t('people.saved'))
    } else {
      const created = await store.create({ ...form })
      ui.toast(t('people.created', { name: fullName(created) }))
    }
    emit('close')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}

async function remove() {
  const person = props.person
  if (!person) return
  const ok = await ui.confirm({
    title: t('people.deleteTitle', { name: fullName(person) }),
    message: t('people.deleteBody'),
    confirmLabel: t('common.delete'),
    destructive: true,
  })
  if (!ok) return
  try {
    await store.remove(person.id)
    ui.toast(t('people.deleted', { name: fullName(person) }))
    emit('close')
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}
</script>

<template>
  <AppSheet
    :open="open"
    :title="person ? t('people.editTitle') : t('people.newTitle')"
    :confirm-label="person ? t('common.save') : t('common.add')"
    :confirm-disabled="!form.firstName.trim()"
    :busy="busy"
    @close="emit('close')"
    @confirm="save"
  >
    <form class="pt-2" @submit.prevent="save">
      <ListSection>
        <input v-model="form.firstName" class="field !rounded-none !bg-transparent" autocomplete="off" :placeholder="t('people.firstName')" :aria-label="t('people.firstName')" maxlength="60" autofocus />
        <input v-model="form.lastName" class="field !rounded-none !bg-transparent" autocomplete="off" :placeholder="t('people.lastName')" :aria-label="t('people.lastName')" maxlength="80" />
      </ListSection>

      <ListSection>
        <div class="flex flex-col gap-2 px-4 py-3">
          <span class="text-[0.875rem] text-ink-2">{{ t('people.genderLabel') }}</span>
          <SegmentedControl
            v-model="gender"
            :label="t('people.genderLabel')"
            :options="[
              { value: 'male', label: t('gender.male') },
              { value: 'female', label: t('gender.female') },
              { value: 'none', label: t('gender.none') },
            ]"
          />
        </div>
        <label class="flex min-h-[52px] items-center justify-between gap-3 px-4">
          <span>{{ t('people.ageLabel') }}</span>
          <input v-model="ageText" class="w-24 bg-transparent py-3 text-right outline-none" type="number" inputmode="numeric" min="0" max="120" :placeholder="t('common.optional')" />
        </label>
      </ListSection>

      <ListSection :footer="form.married ? t('people.spouseHint') : undefined">
        <div class="flex flex-col gap-2 px-4 py-3">
          <span class="text-[0.875rem] text-ink-2">{{ t('people.maritalLabel') }}</span>
          <SegmentedControl
            v-model="marital"
            :label="t('people.maritalLabel')"
            :options="[
              { value: 'single', label: t('marital.single') },
              { value: 'married', label: t('marital.married') },
            ]"
          />
        </div>
        <label v-if="form.married" class="flex min-h-[52px] items-center justify-between gap-3 px-4">
          <span>{{ t('people.spouse') }}</span>
          <select v-model="form.spouseId" class="min-h-[44px] max-w-[60%] cursor-pointer truncate bg-transparent text-right text-accent outline-none">
            <option :value="null">{{ t('people.spouseNone') }}</option>
            <option v-for="p in spouseOptions" :key="p.id" :value="p.id">{{ fullName(p) }}</option>
          </select>
        </label>
      </ListSection>

      <ListSection>
        <input v-model="form.phone" class="field !rounded-none !bg-transparent" type="tel" autocomplete="off" :placeholder="t('people.phone')" :aria-label="t('people.phone')" maxlength="40" />
        <input v-model="form.email" class="field !rounded-none !bg-transparent" type="email" inputmode="email" autocomplete="off" :placeholder="t('people.emailLabel')" :aria-label="t('people.emailLabel')" maxlength="120" />
        <textarea v-model="form.notes" class="field min-h-[88px] resize-none !rounded-none !bg-transparent" :placeholder="t('people.notes')" :aria-label="t('people.notes')" maxlength="500" />
      </ListSection>

      <ListSection :footer="t('people.activeHint')">
        <SwitchRow v-model="form.active" :label="t('people.active')" />
      </ListSection>

      <p v-if="error" class="mb-4 px-4 text-[0.875rem] text-danger" role="alert">{{ error }}</p>

      <button v-if="person" type="button" class="btn-danger w-full" @click="remove">{{ t('people.deletePerson') }}</button>
      <button type="submit" class="sr-only">{{ t('common.save') }}</button>
    </form>
  </AppSheet>
</template>
