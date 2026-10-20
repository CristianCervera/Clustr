import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requiere sesión y muestra la barra de pestañas. */
    auth?: boolean
    /** Solo para visitantes (login, registro). */
    guest?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/groups' },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
    { path: '/groups', component: () => import('@/views/GroupsView.vue'), meta: { auth: true } },
    { path: '/groups/:id', component: () => import('@/views/GroupSetView.vue'), meta: { auth: true }, props: true },
    { path: '/people', component: () => import('@/views/PeopleView.vue'), meta: { auth: true } },
    { path: '/profile', component: () => import('@/views/ProfileView.vue'), meta: { auth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/groups' },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return { path: '/login', query: to.fullPath !== '/groups' ? { next: to.fullPath } : {} }
  if (to.meta.guest && auth.isLoggedIn) return '/groups'
  if (auth.isLoggedIn && !auth.user) {
    // Si falla la red se sigue adelante: la vista mostrará el error. Si el token no vale, api() cierra la sesión.
    await auth.fetchMe().catch(() => undefined)
    if (!auth.isLoggedIn && to.meta.auth) return '/login'
  }
})

export default router
