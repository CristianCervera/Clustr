import { describe, expect, it } from 'vitest'
import { estimateGroups, initials, orderMembers } from '../people'
import { fileNameOf, groupsToText } from '../exportGroups'
import type { Person } from '@/types'

const person = (id: string, firstName: string, spouseId: string | null = null): Person => ({
  id,
  firstName,
  lastName: '',
  gender: null,
  age: null,
  married: Boolean(spouseId),
  spouseId,
  phone: '',
  email: '',
  notes: '',
  active: true,
})

describe('people utils', () => {
  it('saca las iniciales', () => {
    expect(initials({ firstName: 'ana', lastName: 'garcía' })).toBe('AG')
    expect(initials({ firstName: 'Luis', lastName: '' })).toBe('LU')
  })

  it('pone a los matrimonios juntos al ordenar', () => {
    const list = [person('1', 'Zoe', '3'), person('2', 'Bea'), person('3', 'Carlos', '1')]
    expect(orderMembers(list).map((p) => p.firstName)).toEqual(['Bea', 'Carlos', 'Zoe'])
  })

  it('estima grupos igual que el servidor', () => {
    const people = Array.from({ length: 10 }, (_, i) => person(String(i), `P${i}`))
    expect(estimateGroups(people, { mode: 'count', value: 3, couples: 'together' })).toEqual({ groups: 3, min: 3, max: 4 })
    expect(estimateGroups(people, { mode: 'size', value: 5, couples: 'together' })).toEqual({ groups: 2, min: 5, max: 5 })
    // Dos personas casadas cuentan como una sola pieza: no salen más grupos que piezas.
    const couple = [person('a', 'A', 'b'), person('b', 'B', 'a')]
    expect(estimateGroups(couple, { mode: 'count', value: 2, couples: 'together' }).groups).toBe(1)
    expect(estimateGroups(couple, { mode: 'count', value: 2, couples: 'apart' }).groups).toBe(2)
  })
})

describe('export', () => {
  it('genera texto para compartir', () => {
    const text = groupsToText([[person('1', 'Ana'), person('2', 'Luis')], [person('3', 'Eva')]], {
      title: 'Retiro',
      subtitle: '20 oct',
      groupName: (i) => `Grupo ${i + 1}`,
      members: (n) => `${n} personas`,
    })
    expect(text).toBe('Retiro\n20 oct\n\n*Grupo 1* (2 personas)\n• Ana\n• Luis\n\n*Grupo 2* (1 personas)\n• Eva')
  })

  it('crea nombres de archivo seguros', () => {
    expect(fileNameOf('Grupos del 20/10 — Año nuevo')).toBe('grupos-del-20-10-ano-nuevo')
    expect(fileNameOf('***')).toBe('clustr')
  })
})
