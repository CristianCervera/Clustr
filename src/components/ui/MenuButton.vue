<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch, type Component } from 'vue'

/** Botón que despliega un menú de acciones (exportar, renombrar…). */
export interface MenuItem {
  label: string
  icon?: Component
  destructive?: boolean
  action: () => void
}

defineProps<{ items: MenuItem[]; label: string; align?: 'left' | 'right' }>()
const open = ref(false)
const root = ref<HTMLElement>()
const menuId = useId()

const trigger = ref<HTMLButtonElement>()

function onDocument(e: Event) {
  if (e instanceof KeyboardEvent) {
    if (e.key !== 'Escape') return
    open.value = false
    trigger.value?.focus()
  } else if (!root.value?.contains(e.target as Node)) open.value = false
}

// Flechas, Inicio y Fin recorren las opciones, como en un menú del sistema.
function onMenuKey(e: KeyboardEvent) {
  const items = [...(root.value?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
  const current = items.indexOf(document.activeElement as HTMLElement)
  const next = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: items.length - 1 }[e.key]
  if (next === undefined || !items.length) return
  e.preventDefault()
  items[(next + items.length) % items.length]?.focus()
}
watch(open, (value) => {
  const method = value ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocument)
  document[method]('keydown', onDocument)
  if (value) setTimeout(() => root.value?.querySelector<HTMLElement>('[role=menuitem]')?.focus())
})
onBeforeUnmount(() => (open.value = false))

function run(item: MenuItem) {
  open.value = false
  // La opción desaparece con el menú: si abre una hoja, el foco debe volver luego al botón.
  trigger.value?.focus()
  item.action()
}
</script>

<template>
  <div ref="root" class="relative">
    <button ref="trigger" type="button" :aria-expanded="open" :aria-controls="menuId" aria-haspopup="menu" :aria-label="label" @click="open = !open">
      <slot />
    </button>
    <Transition enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0 scale-95" enter-active-class="transition duration-150" leave-active-class="transition duration-100">
      <ul
        v-if="open"
        :id="menuId"
        role="menu"
        @keydown="onMenuKey"
        class="glass absolute top-full z-40 mt-2 min-w-[14rem] origin-top-right overflow-hidden rounded-2xl py-1 shadow-card ring-1 ring-line"
        :class="align === 'left' ? 'left-0' : 'right-0'"
      >
        <li v-for="item in items" :key="item.label" role="none">
          <button
            type="button"
            role="menuitem"
            class="flex min-h-[44px] w-full items-center justify-between gap-6 px-4 text-left hover:bg-ink/5 focus-visible:bg-ink/5"
            :class="item.destructive ? 'text-danger' : 'text-ink'"
            @click="run(item)"
          >
            {{ item.label }}
            <component :is="item.icon" v-if="item.icon" :size="18" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>
