import type { GroupPreferences, Member, Person } from '@/types'

type Named = Pick<Person, 'firstName' | 'lastName'>

export const fullName = (p: Named) => [p.firstName, p.lastName].filter(Boolean).join(' ')

export function initials(p: Named): string {
  const first = p.firstName.trim()[0] ?? ''
  const last = p.lastName.trim()[0] ?? p.firstName.trim()[1] ?? ''
  return (first + last).toUpperCase()
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

export function sortPeople<T extends Named>(people: T[]): T[] {
  return [...people].sort((a, b) => collator.compare(fullName(a), fullName(b)))
}

/** Texto comparable para búsquedas: sin tildes ni mayúsculas. */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Cuántos grupos saldrán y de qué tamaño, con la misma regla que el servidor.
 * Los matrimonios que van juntos cuentan como una sola pieza a la hora de limitar el número de grupos.
 */
export function estimateGroups(people: Person[], prefs: Pick<GroupPreferences, 'mode' | 'value' | 'couples'>) {
  const total = people.length
  if (total === 0) return { groups: 0, min: 0, max: 0 }
  const ids = new Set(people.map((p) => p.id))
  const pairedPeople = prefs.couples === 'together' ? people.filter((p) => p.spouseId && ids.has(p.spouseId)).length : 0
  const units = total - pairedPeople / 2
  const wanted = prefs.mode === 'count' ? prefs.value : Math.round(total / prefs.value)
  const groups = Math.max(1, Math.min(wanted, units))
  return { groups, min: Math.floor(total / groups), max: Math.ceil(total / groups) }
}

/** Ordena los miembros de un grupo: matrimonios juntos, luego por nombre. */
export function orderMembers<T extends Named & { spouseId: string | null } & ({ id: string } | { personId: string | null })>(members: T[]): T[] {
  const idOf = (m: T) => ('id' in m ? m.id : m.personId)
  const sorted = sortPeople(members)
  const out: T[] = []
  const used = new Set<T>()
  for (const m of sorted) {
    if (used.has(m)) continue
    used.add(m)
    out.push(m)
    const spouse = sorted.find((o) => !used.has(o) && m.spouseId && idOf(o) === m.spouseId)
    if (spouse) {
      used.add(spouse)
      out.push(spouse)
    }
  }
  return out
}

export type GroupMember = Person | Member
