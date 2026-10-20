<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fullName, orderMembers, type GroupMember } from '@/services/people'

/**
 * Tarjeta de un grupo. A la izquierda de los nombres corre el «hilo» del logo:
 * un nodo azul por persona y un trazo verde agua que une a cada matrimonio.
 */
const props = defineProps<{ index: number; members: GroupMember[]; interactive?: boolean }>()
const emit = defineEmits<{ select: [member: GroupMember] }>()
const { t } = useI18n()

const idOf = (m: GroupMember) => ('id' in m ? m.id : m.personId)
const ordered = computed(() => orderMembers(props.members))
const linkedToNext = (i: number) => {
  const a = ordered.value[i]
  const b = ordered.value[i + 1]
  return Boolean(a?.spouseId && b && a.spouseId === idOf(b))
}
const composition = computed(() => {
  const men = props.members.filter((m) => m.gender === 'male').length
  const women = props.members.filter((m) => m.gender === 'female').length
  return men || women ? `${men} ${t('gender.maleShort')} · ${women} ${t('gender.femaleShort')}` : ''
})
</script>

<template>
  <article class="rounded-[1.25rem] bg-surface p-4 shadow-card" :aria-labelledby="`group-${index}`">
    <header class="mb-2 flex items-center gap-2.5">
      <span class="relative grid h-7 w-7 place-items-center rounded-full bg-teal/25" aria-hidden="true">
        <span class="h-3.5 w-3.5 rounded-full bg-accent-fill" />
      </span>
      <h3 :id="`group-${index}`" class="shrink-0 whitespace-nowrap text-[1.0625rem] font-semibold">{{ t('groups.group', { n: index + 1 }) }}</h3>
      <span class="min-w-0 flex-1 text-right text-[0.8125rem] tabular-nums text-ink-2">
        {{ t('groups.members', members.length) }}<template v-if="composition"> · {{ composition }}</template>
      </span>
    </header>
    <ul>
      <li v-for="(m, i) in ordered" :key="`${idOf(m)}-${i}`" class="relative">
        <span v-if="linkedToNext(i)" class="absolute left-[11px] top-1/2 h-full w-[3px] rounded-full bg-teal" aria-hidden="true" />
        <component
          :is="interactive ? 'button' : 'div'"
          :type="interactive ? 'button' : undefined"
          class="relative flex min-h-[40px] w-full items-center gap-3 rounded-lg pl-1 text-left"
          :class="interactive ? 'transition-colors hover:bg-ink/[0.04] active:bg-ink/[0.07]' : ''"
          @click="interactive && emit('select', m)"
        >
          <span class="relative grid h-6 w-6 shrink-0 place-items-center" aria-hidden="true">
            <span class="h-2.5 w-2.5 rounded-full ring-[3px]" :class="m.spouseId && (linkedToNext(i) || linkedToNext(i - 1)) ? 'bg-accent-fill ring-teal' : 'bg-accent-fill ring-accent-soft'" />
          </span>
          <span class="truncate">{{ fullName(m) }}</span>
        </component>
      </li>
    </ul>
  </article>
</template>
