import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { GroupPreferences, GroupSet, Member, Person } from '@/types'

export const DEFAULT_PREFERENCES: GroupPreferences = {
  mode: 'count',
  value: 4,
  couples: 'together',
  balanceGender: true,
  balanceAge: false,
  mixMarital: true,
  spreadOccasional: true,
}

/** Antes los grupos sin guardar se recordaban en el navegador; ahora todo reparto se guarda. */
try {
  localStorage.removeItem('clustr.currentGroups')
} catch {
  // Sin almacenamiento no hay nada que limpiar.
}

/**
 * Composición de un reparto como posiciones en la lista de todos sus miembros (grupo a grupo),
 * que es como el servidor recibe los cambios.
 */
export function layoutOf(groups: Member[][], all: Member[] = groups.flat()): number[][] {
  return groups.map((g) => g.map((m) => all.indexOf(m)))
}

/** Mueve a un miembro a otro grupo; los grupos que se quedan vacíos desaparecen, y su nombre con ellos. */
export function moveMember(set: GroupSet, member: Member, toGroup: number) {
  const groups = set.groups.map((g) => g.filter((m) => m !== member))
  groups[toGroup]?.push(member)
  const kept = groups.map((g, i) => ({ g, name: set.groupNames[i] ?? '' })).filter(({ g }) => g.length)
  return { layout: layoutOf(kept.map(({ g }) => g), set.groups.flat()), groupNames: kept.map(({ name }) => name) }
}

export const useGroupsStore = defineStore('groups', () => {
  const sets = ref<GroupSet[]>([])
  const setsLoaded = ref(false)

  function upsert(set: GroupSet) {
    sets.value = sets.value.some((s) => s.id === set.id) ? sets.value.map((s) => (s.id === set.id ? set : s)) : [set, ...sets.value]
    return set
  }

  async function loadSets(force = false) {
    if (setsLoaded.value && !force) return
    sets.value = await api<GroupSet[]>('/group-sets')
    setsLoaded.value = true
  }

  const generate = (preferences: GroupPreferences, personIds?: string[]) =>
    api<{ groups: Person[][] }>('/groups/generate', { method: 'POST', body: { preferences, ...(personIds ? { personIds } : {}) } })

  /** Genera los grupos con quienes participan y los guarda en un reparto con ese nombre. */
  async function createSet(preferences: GroupPreferences, name: string) {
    const { groups } = await generate(preferences)
    return upsert(
      await api<GroupSet>('/group-sets', {
        method: 'POST',
        body: { name, preferences, groups: groups.map((g) => g.map((p) => p.id)) },
      }),
    )
  }

  /** Vuelve a repartir a las mismas personas con los criterios del reparto. */
  async function regenerateSet(set: GroupSet) {
    const all = set.groups.flat()
    const ids = all.flatMap((m) => (m.personId ? [m.personId] : []))
    const { groups } = await generate({ ...DEFAULT_PREFERENCES, ...set.preferences }, ids)
    const position = new Map(all.map((m, i) => [m.personId, i]))
    const layout = groups.map((g) => g.map((p) => position.get(p.id)!))
    // Quien ya no está en la lista no se puede repartir: va al grupo más pequeño.
    all.forEach((m, i) => {
      if (m.personId) return
      layout.reduce((a, b) => (b.length < a.length ? b : a)).push(i)
    })
    return updateSet(set.id, { layout })
  }

  async function getSet(id: string) {
    const cached = sets.value.find((s) => s.id === id)
    if (cached) return cached
    return api<GroupSet>(`/group-sets/${id}`)
  }

  async function updateSet(id: string, body: { name?: string; groupNames?: string[]; layout?: number[][] }) {
    return upsert(await api<GroupSet>(`/group-sets/${id}`, { method: 'PATCH', body }))
  }

  async function removeSet(id: string) {
    await api(`/group-sets/${id}`, { method: 'DELETE' })
    sets.value = sets.value.filter((s) => s.id !== id)
  }

  function reset() {
    sets.value = []
    setsLoaded.value = false
  }

  return { sets, setsLoaded, loadSets, createSet, regenerateSet, getSet, updateSet, removeSet, reset }
})
