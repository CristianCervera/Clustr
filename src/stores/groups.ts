import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
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

const CURRENT_KEY = 'clustr.currentGroups'

interface Current {
  groups: Person[][]
  preferences: GroupPreferences
  generatedAt: string
  /** Reparto guardado que corresponde a estos grupos, mientras no se retoquen. */
  savedSetId: string | null
}

function readCurrent(): Current | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    const value = raw ? (JSON.parse(raw) as Current) : null
    return Array.isArray(value?.groups) && value.preferences ? value : null
  } catch {
    return null
  }
}

export const useGroupsStore = defineStore('groups', () => {
  /**
   * Grupos actuales: el último reparto generado. Se puede retocar moviendo personas y se recuerda
   * en este navegador hasta que se genere otro o se cierre la sesión.
   */
  const saved = readCurrent()
  const preview = ref<Person[][] | null>(saved?.groups ?? null)
  const previewPreferences = ref<GroupPreferences | null>(saved?.preferences ?? null)
  const generatedAt = ref<Date | null>(saved ? new Date(saved.generatedAt) : null)
  const savedSetId = ref<string | null>(saved?.savedSetId ?? null)
  const sets = ref<GroupSet[]>([])
  const setsLoaded = ref(false)

  watch([preview, savedSetId], () => {
    try {
      if (!preview.value || !previewPreferences.value) localStorage.removeItem(CURRENT_KEY)
      else
        localStorage.setItem(
          CURRENT_KEY,
          JSON.stringify({
            groups: preview.value,
            preferences: previewPreferences.value,
            generatedAt: (generatedAt.value ?? new Date()).toISOString(),
            savedSetId: savedSetId.value,
          } satisfies Current),
        )
    } catch {
      // Sin almacenamiento los grupos actuales duran hasta recargar.
    }
  })

  async function generate(preferences: GroupPreferences) {
    const res = await api<{ groups: Person[][] }>('/groups/generate', { method: 'POST', body: { preferences } })
    previewPreferences.value = { ...preferences }
    generatedAt.value = new Date()
    savedSetId.value = null
    preview.value = res.groups
  }

  function move(personId: string, toGroup: number) {
    if (!preview.value) return
    const person = preview.value.flat().find((p) => p.id === personId)
    if (!person) return
    const next = preview.value.map((g) => g.filter((p) => p.id !== personId))
    next[toGroup]?.push(person)
    savedSetId.value = null
    preview.value = next.filter((g) => g.length)
  }

  function clearPreview() {
    preview.value = null
    previewPreferences.value = null
    generatedAt.value = null
    savedSetId.value = null
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
    savedSetId.value = set.id
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
    if (savedSetId.value === id) savedSetId.value = null
  }

  function reset() {
    clearPreview()
    sets.value = []
    setsLoaded.value = false
  }

  return { preview, previewPreferences, generatedAt, savedSetId, sets, setsLoaded, generate, move, clearPreview, loadSets, savePreview, getSet, renameSet, removeSet, reset }
})
