import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, getToken, setToken } from '@/services/api'
import type { User } from '@/types'
import { useSettingsStore } from './settings'

interface Session {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())
  const isLoggedIn = computed(() => Boolean(token.value))

  function start(session: Session) {
    token.value = session.token
    setToken(session.token)
    user.value = session.user
  }

  async function login(email: string, password: string) {
    start(await api<Session>('/auth/login', { method: 'POST', body: { email, password } }))
  }

  async function register(name: string, email: string, password: string) {
    const { locale } = useSettingsStore()
    start(await api<Session>('/auth/register', { method: 'POST', body: { name, email, password, locale } }))
  }

  async function loginWithGoogle(credential: string) {
    const { locale } = useSettingsStore()
    start(await api<Session>('/auth/google', { method: 'POST', body: { credential, locale } }))
    useSettingsStore().adopt(user.value!)
  }

  async function fetchMe() {
    user.value = await api<User>('/auth/me')
    useSettingsStore().adopt(user.value)
  }

  async function update(changes: Partial<Pick<User, 'name' | 'locale' | 'theme' | 'preferences'>>) {
    user.value = await api<User>('/auth/me', { method: 'PATCH', body: changes })
  }

  async function changePassword(newPassword: string, currentPassword?: string) {
    await api('/auth/me/password', { method: 'PUT', body: { newPassword, currentPassword } })
    if (user.value) user.value.hasPassword = true
  }

  async function deleteAccount() {
    await api('/auth/me', { method: 'DELETE' })
    logout()
  }

  function logout() {
    token.value = null
    user.value = null
    setToken(null)
  }

  return { user, token, isLoggedIn, login, register, loginWithGoogle, fetchMe, update, changePassword, deleteAccount, logout }
})
