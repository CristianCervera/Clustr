import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGroupsStore } from '../groups'
import type { Person } from '@/types'

const p = (id: string): Person => ({
  id,
  firstName: id,
  lastName: '',
  gender: null,
  age: null,
  married: false,
  spouseId: null,
  phone: '',
  email: '',
  notes: '',
  active: true,
})

describe('groups store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('mueve a una persona de grupo y quita los grupos que se quedan vacíos', () => {
    const store = useGroupsStore()
    store.preview = [[p('a'), p('b')], [p('c')]]
    store.move('a', 1)
    expect(store.preview!.map((g) => g.map((x) => x.id))).toEqual([['b'], ['c', 'a']])
    store.move('b', 1)
    expect(store.preview!.map((g) => g.map((x) => x.id))).toEqual([['c', 'a', 'b']])
  })
})
