import type { Gender, Person } from '@/types'
import { orderMembers, searchKey } from './people'

export interface ImportRow {
  firstName: string
  lastName: string
  gender: Gender | null
  age: number | null
  married: boolean
  spouseName?: string
  phone: string
  email: string
  notes: string
  active: boolean
}

export interface ParseResult {
  rows: ImportRow[]
  /** Filas que no se importarán (número de fila de Excel, empezando en 1). */
  skipped: number[]
  /** No hay ninguna columna que parezca el nombre. */
  missingNameColumn: boolean
}

type Field = 'firstName' | 'lastName' | 'phone' | 'email' | 'spouse'

/** Columnas del Excel; cabeceras aceptadas en español, inglés, italiano y francés (ya normalizadas). */
const HEADERS: Record<Field, string[]> = {
  firstName: ['nombre', 'name', 'first name', 'firstname', 'given name', 'nome', 'prenom'],
  lastName: ['apellidos', 'apellido', 'last name', 'lastname', 'surname', 'family name', 'cognome', 'nom', 'nom de famille'],
  phone: ['telefono', 'movil', 'celular', 'phone', 'mobile', 'telephone', 'cellulare', 'portable'],
  email: ['email', 'e-mail', 'correo', 'correo electronico', 'mail'],
  spouse: ['conyuge', 'pareja', 'esposo', 'esposa', 'esposo/a', 'spouse', 'partner', 'husband/wife', 'coniuge', 'conjoint', 'conjointe', 'conjoint(e)', 'epoux'],
}

const LIMITS = { firstName: 60, lastName: 80, phone: 40, email: 120, notes: 500, spouse: 140 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeHeader = (value: unknown) => searchKey(String(value ?? '')).replace(/[:*]/g, '').replace(/\s+/g, ' ')

function text(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

/**
 * Convierte las filas de una hoja (la primera, cabeceras) en personas a importar. Quien tiene
 * cónyuge está casado: el servidor los vincula para que siempre vayan juntos.
 */
export function parseSheet(sheet: unknown[][]): ParseResult {
  const [header = [], ...body] = sheet
  const columns = new Map<Field, number>()
  header.forEach((cell, index) => {
    const key = normalizeHeader(cell)
    for (const [field, names] of Object.entries(HEADERS) as [Field, string[]][]) {
      if (!columns.has(field) && names.includes(key)) columns.set(field, index)
    }
  })
  if (!columns.has('firstName')) return { rows: [], skipped: [], missingNameColumn: true }

  const cell = (row: unknown[], field: Field) => {
    const index = columns.get(field)
    return index === undefined ? undefined : row[index]
  }

  const rows: ImportRow[] = []
  const skipped: number[] = []
  body.forEach((row, i) => {
    if (row.every((c) => text(c) === '')) return
    const firstName = text(cell(row, 'firstName')).slice(0, LIMITS.firstName)
    if (!firstName) {
      skipped.push(i + 2)
      return
    }
    const spouseName = text(cell(row, 'spouse')).slice(0, LIMITS.spouse)
    const rawEmail = text(cell(row, 'email')).toLowerCase()
    const validEmail = EMAIL.test(rawEmail) && rawEmail.length <= LIMITS.email
    rows.push({
      firstName,
      lastName: text(cell(row, 'lastName')).slice(0, LIMITS.lastName),
      gender: null,
      age: null,
      married: Boolean(spouseName),
      ...(spouseName ? { spouseName } : {}),
      phone: text(cell(row, 'phone')).slice(0, LIMITS.phone),
      email: validEmail ? rawEmail : '',
      // Un email mal escrito no impide importar a la persona: se guarda en las notas.
      notes: rawEmail && !validEmail ? rawEmail.slice(0, LIMITS.notes) : '',
      active: true,
    })
  })
  return { rows, skipped, missingNameColumn: false }
}

export async function readPeopleFile(file: File): Promise<ParseResult> {
  const { readSheet } = await import('read-excel-file/browser')
  return parseSheet((await readSheet(file)) as unknown[][])
}

type Translate = (key: string) => string

const headerRow = (t: Translate) =>
  ['firstName', 'lastName', 'phone', 'email', 'spouse'].map((k) => ({ value: t(`excel.${k}`), fontWeight: 'bold' as const }))

const COLUMNS = [16, 22, 16, 28, 26].map((width) => ({ width }))

async function writeSheet(rows: unknown[][], fileName: string) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  // Los tipos de la librería no admiten celdas mixtas en un array genérico.
  await writeExcelFile(rows as never, { columns: COLUMNS } as never).toFile(`${fileName}.xlsx`)
}

/** Plantilla con las cabeceras en el idioma actual y unas filas de ejemplo. */
export function downloadTemplate(t: Translate) {
  return writeSheet(
    [
      headerRow(t),
      ['Ana', 'García', '600 000 000', 'ana@example.com', 'Luis Pérez'],
      ['Luis', 'Pérez', '', '', 'Ana García'],
      ['Marta', 'Ruiz', '', '', ''],
    ],
    t('excel.templateName'),
  )
}

/** Exporta la lista en el mismo formato que la plantilla, con cada matrimonio en filas seguidas. */
export function exportPeople(people: Person[], t: Translate) {
  const byId = new Map(people.map((p) => [p.id, p]))
  return writeSheet(
    [
      headerRow(t),
      ...orderMembers(people).map((p) => {
        const spouse = p.spouseId ? byId.get(p.spouseId) : undefined
        return [p.firstName, p.lastName, p.phone, p.email, spouse ? `${spouse.firstName} ${spouse.lastName}`.trim() : '']
      }),
    ],
    t('excel.fileName'),
  )
}
