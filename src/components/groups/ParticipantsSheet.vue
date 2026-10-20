<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import AppSheet from '@/components/ui/AppSheet.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { useErrorText } from '@/composables/useErrorText'
import { fullName, searchKey } from '@/services/people'
import { usePeopleStore } from '@/stores/people'
import { useUiStore } from '@/stores/ui'

/** Quién participa en el próximo reparto. Los cambios se guardan al momento en cada persona. */
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const store = usePeopleStore()
const ui = useUiStore()
const errorText = useErrorText()
const query = ref('')

const visible = computed(() => {
  const q = searchKey(query.value)
  return q ? store.people.filter((p) => searchKey(fullName(p)).includes(q)) : store.people
})

async function set(ids: string[], active: boolean) {
  try {
    await store.setActive(ids, active)
  } catch (e) {
    ui.toast(errorText(e), 'error')
  }
}
</script>

<template>
  <AppSheet :open="open" :title="t('groups.chooseTitle')" :confirm-label="t('common.done')" @close="emit('close')" @confirm="emit('close')">
    <div class="sticky top-0 z-10 space-y-3 bg-canvas pb-3 pt-1">
      <SearchField v-model="query" :placeholder="t('people.searchPlaceholder')" />
      <div class="flex items-center justify-between text-[0.9375rem]">
        <span class="text-ink-2">{{ t('groups.participantsCount', { active: store.activeCount, total: store.people.length }) }}</span>
        <span class="flex gap-1">
          <button type="button" class="btn-plain !min-h-[36px]" @click="set(visible.map((p) => p.id), true)">{{ t('groups.selectAll') }}</button>
          <button type="button" class="btn-plain !min-h-[36px]" @click="set(visible.map((p) => p.id), false)">{{ t('groups.selectNone') }}</button>
        </span>
      </div>
    </div>
    <ul class="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
      <li v-for="p in visible" :key="p.id">
        <label class="flex min-h-[52px] cursor-pointer items-center gap-3 px-4">
          <input type="checkbox" class="peer sr-only" :checked="p.active" @change="set([p.id], ($event.target as HTMLInputElement).checked)" />
          <span
            class="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink-2/40 text-white transition peer-checked:border-accent-fill peer-checked:bg-accent-fill peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
            aria-hidden="true"
          >
            <Check v-if="p.active" :size="14" :stroke-width="3" />
          </span>
          <span class="flex-1 truncate">{{ fullName(p) }}</span>
        </label>
      </li>
    </ul>
  </AppSheet>
</template>
