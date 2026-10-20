import { ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { elementToPng, fileNameOf, groupsToPdf, groupsToText, download, shareOrDownload, type ExportLabels } from '@/services/exportGroups'
import type { GroupMember } from '@/services/people'
import { useUiStore } from '@/stores/ui'
import { useFormatDate } from './useFormatDate'

/** Exportar un reparto a PDF, imagen o texto, y compartirlo. */
export function useGroupExport(groups: Ref<GroupMember[][]>, title: Ref<string>, date: Ref<Date>, poster: Ref<HTMLElement | undefined>) {
  const { t } = useI18n()
  const formatDate = useFormatDate()
  const ui = useUiStore()
  const exporting = ref(false)

  const labels = (): ExportLabels => ({
    title: title.value,
    subtitle: t('groups.generatedOn', { date: formatDate(date.value) }),
    groupName: (i) => t('groups.group', { n: i + 1 }),
    members: (n) => t('groups.members', n),
  })

  async function run(task: () => Promise<void>) {
    if (exporting.value) return
    exporting.value = true
    try {
      await task()
    } catch {
      ui.toast(t('common.genericError'), 'error')
    } finally {
      exporting.value = false
    }
  }

  const image = async () => {
    if (!poster.value) throw new Error('Sin póster')
    return elementToPng(poster.value)
  }

  return {
    exporting,
    pdf: () => run(async () => download(await groupsToPdf(groups.value, labels()), `${fileNameOf(title.value)}.pdf`)),
    image: () => run(async () => download(await image(), `${fileNameOf(title.value)}.png`)),
    share: () => run(async () => void (await shareOrDownload(await image(), `${fileNameOf(title.value)}.png`, title.value))),
    copy: () =>
      run(async () => {
        await navigator.clipboard.writeText(groupsToText(groups.value, labels()))
        ui.toast(t('groups.copied'))
      }),
  }
}
