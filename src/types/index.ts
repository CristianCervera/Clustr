export type Gender = 'male' | 'female'
export type CouplesMode = 'together' | 'apart' | 'any'
export type Theme = 'system' | 'light' | 'dark'

export interface GroupPreferences {
  mode: 'count' | 'size'
  value: number
  couples: CouplesMode
  balanceGender: boolean
  balanceAge: boolean
  mixMarital: boolean
  spreadOccasional: boolean
}

export interface User {
  id: string
  email: string
  name: string
  picture: string | null
  locale: string
  theme: Theme
  preferences: GroupPreferences
  hasPassword: boolean
  hasGoogle: boolean
  createdAt: string
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  gender: Gender | null
  age: number | null
  married: boolean
  /** No suele venir: se reparte entre los grupos para que ninguno se quede cojo. */
  occasional: boolean
  spouseId: string | null
  phone: string
  email: string
  notes: string
  active: boolean
}

export type PersonInput = Omit<Person, 'id'>

/** Persona tal y como se guardó en un reparto. */
export interface Member {
  personId: string | null
  firstName: string
  lastName: string
  gender: Gender | null
  age: number | null
  married: boolean
  /** No suele venir: se reparte entre los grupos para que ninguno se quede cojo. */
  occasional: boolean
  spouseId: string | null
}

export interface GroupSet {
  id: string
  name: string
  preferences: Partial<GroupPreferences>
  createdAt: string
  /** Nombre de cada grupo, en el mismo orden que `groups`; vacío para «Grupo N». */
  groupNames: string[]
  groups: Member[][]
}

export interface Stats {
  people: number
  married: number
  /** Matrimonios: cada pareja vinculada cuenta una vez. */
  couples: number
  occasional: number
  active: number
  groupSets: number
}
