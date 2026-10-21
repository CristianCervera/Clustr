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
  leaders: false,
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

/** Busca al cónyuge de un miembro dentro del mismo reparto y el grupo en el que está. */
export function spouseIn(set: GroupSet, member: Member): { spouse: Member; group: number } | null {
  if (!member.spouseId) return null
  for (const [group, members] of set.groups.entries()) {
    const spouse = members.find((m) => m.personId === member.spouseId)
    if (spouse) return { spouse, group }
  }
  return null
}

/** Mueve a uno o varios miembros a otro grupo; los grupos que se quedan vacíos desaparecen, y su nombre con ellos. */
export function moveMember(set: GroupSet, member: Member | Member[], toGroup: number) {
  const moving = Array.isArray(member) ? member : [member]
  const groups = set.groups.map((g) => g.filter((m) => !moving.includes(m)))
  groups[toGroup]?.push(...moving)
  const kept = groups.map((g, i) => ({ g, name: set.groupNames[i] ?? '' })).filter(({ g }) => g.length)
  return { layout: layoutOf(kept.map(({ g }) => g), set.groups.flat()), groupNames: kept.map(({ name }) => name) }
}

/**
 * Responsables de cada grupo: el primero de cada uno (al azar) y, si su cónyuge va en el mismo
 * grupo, también él. Devuelve sus ids.
 */
export function pickLeaders(groups: Person[][], rng: () => number = Math.random): string[] {
  return groups.flatMap((group) => {
    const first = group[Math.floor(rng() * group.length)]
    if (!first) return []
    const spouse = group.find((p) => first.spouseId && p.id === first.spouseId)
    return spouse ? [first.id, spouse.id] : [first.id]
  })
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
    const heads = preferences.leaders ? pickLeaders(groups) : []
    return upsert(
      await api<GroupSet>('/group-sets', {
        method: 'POST',
        body: { name, preferences, groups: groups.map((g) => g.map((p) => p.id)), heads },
      }),
    )
  }

  /** Vuelve a repartir a las mismas personas con los criterios del reparto. */
  async function regenerateSet(set: GroupSet) {
    // En un reparto por cabezas, el servidor vuelve a mezclar al resto y deja a cada cabeza al frente.
    if (set.groups.flat().some((m) => m.head)) return upsert(await api<GroupSet>(`/group-sets/${set.id}/remix`, { method: 'POST' }))
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

  /** Crea un reparto nuevo en el que cada miembro del grupo elegido encabeza un grupo con el resto. */
  async function createHeadsSet(id: string, group: number, name: string, couples: 'together' | 'apart') {
    return upsert(await api<GroupSet>(`/group-sets/${id}/heads`, { method: 'POST', body: { group, name, couples } }))
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

  return { sets, setsLoaded, loadSets, createSet, regenerateSet, createHeadsSet, getSet, updateSet, removeSet, reset }
})
