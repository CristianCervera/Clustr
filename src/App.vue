<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import TabBar from '@/components/ui/TabBar.vue'
import SideBar from '@/components/ui/SideBar.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const route = useRoute()
const ui = useUiStore()
</script>

<template>
  <div class="min-h-dvh" style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right)">
    <RouterView v-slot="{ Component }">
      <main
        class="transition-[padding] duration-200"
        :class="route.meta.auth ? ['pb-32 lg:pb-10', ui.sidebarHidden ? 'lg:pl-16' : 'lg:pl-[17.5rem]'] : ''"
      >
        <component :is="Component" />
      </main>
    </RouterView>
    <TabBar v-if="route.meta.auth" />
    <SideBar v-if="route.meta.auth" />
    <ToastHost />
    <ConfirmDialog />
  </div>
</template>
