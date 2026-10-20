import { CircleUserRound, LayoutGrid, Users } from 'lucide-vue-next'

/** Secciones principales: las comparten la barra de pestañas (móvil) y la barra lateral (escritorio). */
export const NAV_ITEMS = [
  { to: '/groups', label: 'tabs.groups', icon: LayoutGrid },
  { to: '/people', label: 'tabs.people', icon: Users },
  { to: '/profile', label: 'tabs.profile', icon: CircleUserRound },
]

/** Activa también en las subrutas (p. ej. /groups/:id). */
export const isNavActive = (path: string, to: string) => path === to || path.startsWith(`${to}/`)
