import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { handleUnauthorized } from './services/api'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'
import { usePeopleStore } from './stores/people'
import { useGroupsStore } from './stores/groups'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)

// Aplica el tema y el idioma guardados antes de pintar nada.
useSettingsStore()

const auth = useAuthStore()
auth.$onAction(({ name, after }) => {
  if (name !== 'logout') return
  after(() => {
    usePeopleStore().reset()
    useGroupsStore().reset()
  })
})

handleUnauthorized(() => {
  auth.logout()
  useUiStore().toast(i18n.global.t('auth.sessionExpired'), 'error')
  void router.push('/login')
})

app.mount('#app')
