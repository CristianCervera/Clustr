import { describe, expect, it } from 'vitest'
import { layoutOf, moveMember, pickLeaders, spouseIn } from '../groups'
import type { GroupSet, Member, Person } from '@/types'

const m = (id: string): Member => ({
  personId: id,
  firstName: id,
  lastName: '',
  gender: null,
  age: null,
  married: false,
  occasional: false,
  spouseId: null,
})

const setOf = (groups: Member[][], groupNames: string[]): GroupSet => ({ id: 's', name: 'Reparto', preferences: {}, createdAt: '', groupNames, groups })

describe('repartos', () => {
  it('describe la composición por posiciones', () => {
    const [a, b, c] = [m('a'), m('b'), m('c')]
    expect(layoutOf([[a, b], [c]])).toEqual([[0, 1], [2]])
  })

  it('mueve a un miembro y quita los grupos vacíos con su nombre', () => {
    const [a, b, c] = [m('a'), m('b'), m('c')]
    const set = setOf([[a], [b], [c]], ['Leones', '', 'Águilas'])
    expect(moveMember(set, b, 0)).toEqual({ layout: [[0, 1], [2]], groupNames: ['Leones', 'Águilas'] })
    expect(moveMember(set, a, 2)).toEqual({ layout: [[1], [2, 0]], groupNames: ['', 'Águilas'] })
  })

  it('encuentra al cónyuge dentro del reparto y su grupo', () => {
    const [a, b, c] = [{ ...m('a'), married: true, spouseId: 'c' }, m('b'), { ...m('c'), married: true, spouseId: 'a' }]
    const set = setOf([[a, b], [c]], [])
    expect(spouseIn(set, a)).toEqual({ spouse: c, group: 1 })
    expect(spouseIn(set, b)).toBeNull()
    // Su cónyuge no está en este reparto.
    expect(spouseIn(set, { ...m('d'), married: true, spouseId: 'x' })).toBeNull()
  })

  it('mueve a un matrimonio a la vez', () => {
    const [a, b, c, d] = [m('a'), m('b'), m('c'), m('d')]
    const set = setOf([[a, b], [c], [d]], ['', 'Solo', ''])
    // c y d se van al primer grupo; el suyo se queda vacío y desaparece con su nombre.
    expect(moveMember(set, [c, d], 0)).toEqual({ layout: [[0, 1, 2, 3]], groupNames: [''] })
  })

  it('elige un responsable por grupo y, si es un matrimonio del grupo, los dos', () => {
    const p = (id: string, spouseId: string | null = null) => ({ id, spouseId }) as Person
    const groups = [[p('a', 'b'), p('b', 'a'), p('c')], [p('d', 'x'), p('e')]]
    // rng 0: el primero de cada grupo. «a» está casada con «b» (mismo grupo); el cónyuge de «d» no está.
    expect(pickLeaders(groups, () => 0)).toEqual(['a', 'b', 'd'])
    expect(pickLeaders(groups, () => 0.99)).toEqual(['c', 'e'])
  })
})
