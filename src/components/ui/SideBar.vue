<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import BrandLogo from './BrandLogo.vue'
import { NAV_ITEMS, isNavActive } from './navigation'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()
const isActive = (to: string) => isNavActive(route.path, to)

// ⌘\ o Ctrl+\ muestra u oculta la barra lateral, como en otras apps de escritorio.
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
    e.preventDefault()
    ui.toggleSidebar()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="hidden lg:block">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-x-4 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-x-4 opacity-0"
    >
      <nav
        v-if="!ui.sidebarHidden"
        class="glass fixed bottom-3 left-3 top-3 z-30 flex w-64 flex-col rounded-[22px] p-3 shadow-card ring-1 ring-line"
        style="margin-left: env(safe-area-inset-left)"
        :aria-label="t('nav.main')"
      >
        <div class="flex items-center justify-between pb-5 pl-2 pt-1">
          <BrandLogo />
          <button
            type="button"
            class="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
            :aria-label="t('nav.hideSidebar')"
            :title="`${t('nav.hideSidebar')} (Ctrl+\\)`"
            aria-keyshortcuts="Control+Backslash Meta+Backslash"
            @click="ui.toggleSidebar()"
          >
            <PanelLeftClose :size="20" aria-hidden="true" />
          </button>
        </div>
        <ul class="space-y-0.5">
          <li v-for="item in NAV_ITEMS" :key="item.to">
            <RouterLink
              :to="item.to"
              class="flex min-h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors"
              :class="isActive(item.to) ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-ink/5'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              <component :is="item.icon" :size="20" :stroke-width="2.2" aria-hidden="true" :class="isActive(item.to) ? '' : 'text-accent'" />
              {{ t(item.label) }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </Transition>
    <button
      v-if="ui.sidebarHidden"
      type="button"
      class="glass fixed left-3 top-3 z-30 grid size-10 place-items-center rounded-full text-ink-2 shadow-card ring-1 ring-line transition-colors hover:text-ink"
      :aria-label="t('nav.showSidebar')"
      :title="`${t('nav.showSidebar')} (Ctrl+\\)`"
      aria-keyshortcuts="Control+Backslash Meta+Backslash"
      @click="ui.toggleSidebar()"
    >
      <PanelLeftOpen :size="20" aria-hidden="true" />
    </button>
  </div>
</template>
