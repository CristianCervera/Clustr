<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Copy, FileText, Image, Share } from 'lucide-vue-next'
import MenuButton, { type MenuItem } from '@/components/ui/MenuButton.vue'
import GroupsPoster from './GroupsPoster.vue'
import { useGroupExport } from '@/composables/useGroupExport'
import { useFormatDate } from '@/composables/useFormatDate'
import type { GroupMember } from '@/services/people'

const props = defineProps<{ groups: GroupMember[][]; names?: string[]; title: string; date: Date }>()
const { t } = useI18n()
const formatDate = useFormatDate()

const posterWrap = ref<HTMLElement>()
const poster = computed(() => posterWrap.value?.firstElementChild as HTMLElement | undefined)
const exp = useGroupExport(toRef(props, 'groups'), toRef(props, 'names'), toRef(props, 'title'), toRef(props, 'date'), poster)
const canShare = typeof navigator !== 'undefined' && 'share' in navigator

const items = computed<MenuItem[]>(() => [
  ...(canShare ? [{ label: t('groups.share'), icon: Share, action: exp.share }] : []),
  { label: t('groups.exportPdf'), icon: FileText, action: exp.pdf },
  { label: t('groups.exportImage'), icon: Image, action: exp.image },
  { label: t('groups.copyText'), icon: Copy, action: exp.copy },
])
</script>

<template>
  <MenuButton :items="items" :label="t('groups.export')">
    <span class="btn-secondary">
      <Share :size="18" aria-hidden="true" />
      {{ exp.exporting.value ? t('groups.exporting') : t('groups.export') }}
    </span>
  </MenuButton>
  <div ref="posterWrap" class="pointer-events-none fixed left-[-20000px] top-0" aria-hidden="true">
    <GroupsPoster :groups="groups" :names="names" :title="title" :subtitle="t('groups.generatedOn', { date: formatDate(date) })" />
  </div>
</template>
