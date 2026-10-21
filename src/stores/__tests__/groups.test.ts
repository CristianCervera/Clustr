import { describe, expect, it } from 'vitest'
import { layoutOf, moveMember } from '../groups'
import type { GroupSet, Member } from '@/types'

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
})
