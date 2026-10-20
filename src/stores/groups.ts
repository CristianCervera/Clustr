import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { GroupPreferences, GroupSet, Person } from '@/types'

export const DEFAULT_PREFERENCES: GroupPreferences = {
  mode: 'count',
  value: 4,
  couples: 'together',
  balanceGender: true,
  balanceAge: false,
  mixMarital: true,
}

export const useGroupsStore = defineStore('groups', () => {
  /** Último reparto generado, aún sin guardar. Se puede retocar moviendo personas. */
  const preview = ref<Person[][] | null>(null)
  const previewPreferences = ref<GroupPreferences | null>(null)
  const sets = ref<GroupSet[]>([])
  const setsLoaded = ref(false)

  async function generate(preferences: GroupPreferences) {
    const res = await api<{ groups: Person[][] }>('/groups/generate', { method: 'POST', body: { preferences } })
    preview.value = res.groups
    previewPreferences.value = { ...preferences }
  }

  function move(personId: string, toGroup: number) {
    if (!preview.value) return
    const person = preview.value.flat().find((p) => p.id === personId)
    if (!person) return
    const next = preview.value.map((g) => g.filter((p) => p.id !== personId))
    next[toGroup]?.push(person)
    preview.value = next.filter((g) => g.length)
  }

  function clearPreview() {
    preview.value = null
    previewPreferences.value = null
  }

  async function loadSets(force = false) {
    if (setsLoaded.value && !force) return
    sets.value = await api<GroupSet[]>('/group-sets')
    setsLoaded.value = true
  }

  async function savePreview(name: string) {
    if (!preview.value || !previewPreferences.value) throw new Error('Nada que guardar')
    const set = await api<GroupSet>('/group-sets', {
      method: 'POST',
      body: { name, preferences: previewPreferences.value, groups: preview.value.map((g) => g.map((p) => p.id)) },
    })
    sets.value = [set, ...sets.value]
    return set
  }

  async function getSet(id: string) {
    const cached = sets.value.find((s) => s.id === id)
    if (cached) return cached
    return api<GroupSet>(`/group-sets/${id}`)
  }

  async function renameSet(id: string, name: string) {
    const set = await api<GroupSet>(`/group-sets/${id}`, { method: 'PATCH', body: { name } })
    sets.value = sets.value.map((s) => (s.id === id ? set : s))
    return set
  }

  async function removeSet(id: string) {
    await api(`/group-sets/${id}`, { method: 'DELETE' })
    sets.value = sets.value.filter((s) => s.id !== id)
  }

  function reset() {
    clearPreview()
    sets.value = []
    setsLoaded.value = false
  }

  return { preview, previewPreferences, sets, setsLoaded, generate, move, clearPreview, loadSets, savePreview, getSet, renameSet, removeSet, reset }
})
