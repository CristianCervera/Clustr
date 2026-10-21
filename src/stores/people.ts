import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import type { Person, PersonInput } from '@/types'
import type { ImportRow } from '@/services/excel'
import { sortPeople } from '@/services/people'

interface Changed {
  person: Person
  /** La persona y su cónyuge (actual o anterior), que también cambian al vincular. */
  changed: Person[]
}

export interface ImportResult {
  created: number
  couples: number
  /** Cónyuges sin fila propia en el Excel que se han añadido a la lista. */
  addedSpouses: string[]
  people: Person[]
}

export const usePeopleStore = defineStore('people', () => {
  const people = ref<Person[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const byId = computed(() => new Map(people.value.map((p) => [p.id, p])))
  const activeCount = computed(() => people.value.filter((p) => p.active).length)

  function merge(changed: Person[]) {
    const next = new Map(people.value.map((p) => [p.id, p]))
    for (const p of changed) next.set(p.id, p)
    people.value = sortPeople([...next.values()])
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      people.value = await api<Person[]>('/people')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(input: PersonInput) {
    const res = await api<Changed>('/people', { method: 'POST', body: input })
    merge(res.changed)
    return res.person
  }

  /** Alta de un matrimonio escrito de una vez («Pepe y Pepa»): dos personas vinculadas. */
  async function createCouple(first: PersonInput, second: PersonInput) {
    const a = await create({ ...first, married: true, spouseId: null })
    const b = await create({ ...second, married: true, spouseId: a.id })
    return [a, b] as const
  }

  async function update(id: string, input: Partial<PersonInput>) {
    const res = await api<Changed>(`/people/${id}`, { method: 'PATCH', body: input })
    merge(res.changed)
    return res.person
  }

  async function remove(id: string) {
    await api(`/people/${id}`, { method: 'DELETE' })
    people.value = people.value
      .filter((p) => p.id !== id)
      .map((p) => (p.spouseId === id ? { ...p, spouseId: null } : p))
  }

  async function removeAll() {
    await api('/people', { method: 'DELETE' })
    people.value = []
  }

  async function setActive(ids: string[], active: boolean) {
    const set = new Set(ids)
    const before = people.value
    people.value = people.value.map((p) => (set.has(p.id) ? { ...p, active } : p))
    try {
      await api('/people/active', { method: 'POST', body: { ids, active } })
    } catch (e) {
      people.value = before
      throw e
    }
  }

  async function importRows(rows: ImportRow[], replace: boolean) {
    const res = await api<ImportResult>('/people/import', { method: 'POST', body: { people: rows, replace } })
    people.value = res.people
    loaded.value = true
    return res
  }

  function reset() {
    people.value = []
    loaded.value = false
  }

  return { people, loaded, loading, byId, activeCount, load, create, createCouple, update, remove, removeAll, setActive, importRows, reset }
})
