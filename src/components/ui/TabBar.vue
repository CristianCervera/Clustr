<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { NAV_ITEMS as tabs, isNavActive } from './navigation'

const { t } = useI18n()
const route = useRoute()
const isActive = (to: string) => isNavActive(route.path, to)
</script>

<template>
  <nav
    class="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex lg:hidden justify-center px-4"
    style="padding-bottom: max(env(safe-area-inset-bottom), 12px)"
    :aria-label="t('nav.main')"
  >
    <ul class="glass pointer-events-auto flex w-full max-w-sm items-stretch gap-1 rounded-full p-1.5 shadow-card ring-1 ring-line">
      <li v-for="tab in tabs" :key="tab.to" class="flex-1">
        <RouterLink
          :to="tab.to"
          class="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-full transition-colors"
          :class="isActive(tab.to) ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:text-ink'"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
        >
          <component :is="tab.icon" :size="22" :stroke-width="2.2" aria-hidden="true" />
          <span class="text-[0.6875rem] font-semibold">{{ t(tab.label) }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
