import { describe, expect, it } from 'vitest'
import { parseSheet } from '../excel'

describe('parseSheet', () => {
  it('lee nombre, apellidos, teléfono, email y cónyuge', () => {
    const { rows, skipped, missingNameColumn } = parseSheet([
      ['Nombre', 'Apellidos', 'Teléfono', 'Email', 'Cónyuge'],
      ['Ana', 'García', 600111222, 'ANA@example.com', 'Luis Pérez'],
      ['Luis', 'Pérez', '', '', 'Ana García'],
      ['Marta', '', '', 'no-es-un-email', ''],
    ])
    expect(missingNameColumn).toBe(false)
    expect(skipped).toEqual([])
    expect(rows[0]).toEqual({
      firstName: 'Ana',
      lastName: 'García',
      gender: null,
      age: null,
      married: true,
      spouseName: 'Luis Pérez',
      phone: '600111222',
      email: 'ana@example.com',
      notes: '',
      active: true,
    })
    expect(rows[1]).toMatchObject({ married: true, spouseName: 'Ana García' })
    expect(rows[2]).toMatchObject({ married: false, email: '', notes: 'no-es-un-email' })
    expect(rows[2]).not.toHaveProperty('spouseName')
  })

  it('acepta cabeceras en inglés, italiano y francés', () => {
    const en = parseSheet([['First name', 'Last name', 'Phone', 'Email', 'Spouse'], ['John', 'Smith', '555', 'j@x.com', 'Mary Smith']]).rows[0]
    expect(en).toMatchObject({ firstName: 'John', lastName: 'Smith', phone: '555', email: 'j@x.com', married: true, spouseName: 'Mary Smith' })
    const it_ = parseSheet([['Nome', 'Cognome', 'Telefono', 'Email', 'Coniuge'], ['Marco', 'Rossi', '', '', 'Giulia Bianchi']]).rows[0]
    expect(it_).toMatchObject({ firstName: 'Marco', lastName: 'Rossi', married: true, spouseName: 'Giulia Bianchi' })
    const fr = parseSheet([['Prénom', 'Nom', 'Téléphone', 'E-mail', 'Conjoint'], ['Claire', 'Dubois', '', '', '']]).rows[0]
    expect(fr).toMatchObject({ firstName: 'Claire', lastName: 'Dubois', married: false })
  })

  it('ignora columnas que no son del formato', () => {
    const row = parseSheet([['Nombre', 'Sexo', 'Estado civil'], ['Ana', 'Mujer', 'Casada']]).rows[0]
    expect(row).toMatchObject({ firstName: 'Ana', gender: null, married: false })
  })

  it('omite filas vacías y avisa de las que no tienen nombre', () => {
    const { rows, skipped } = parseSheet([['Nombre', 'Teléfono'], ['Ana', 1], ['', ''], ['', 2], ['Luis', '']])
    expect(rows.map((r) => r.firstName)).toEqual(['Ana', 'Luis'])
    expect(skipped).toEqual([4])
  })

  it('detecta que falta la columna del nombre', () => {
    expect(parseSheet([['Foo', 'Bar'], ['x', 'y']]).missingNameColumn).toBe(true)
  })
})

describe('matrimonios en una sola fila', () => {
  it('separa «Jorge y Amparo» en dos personas casadas entre sí', () => {
    const { rows } = parseSheet([
      ['Nombre', 'Apellidos', 'Teléfono', 'Cónyuge'],
      ['Jorge y Amparo', 'García', '600111222', ''],
      ['Pedro e Isabel', 'Ruiz y López', '', ''],
      ['Tom & Mary', '', '', 'Ignorado'],
      ['Marta', 'Soler', '', ''],
    ])
    expect(rows.map((r) => [r.firstName, r.lastName, r.married, r.spouseName])).toEqual([
      ['Jorge', 'García', true, 'Amparo García'],
      ['Amparo', 'García', true, 'Jorge García'],
      ['Pedro', 'Ruiz', true, 'Isabel López'],
      ['Isabel', 'López', true, 'Pedro Ruiz'],
      ['Tom', '', true, 'Mary'],
      ['Mary', '', true, 'Tom'],
      ['Marta', 'Soler', false, undefined],
    ])
    expect(rows[1]).toMatchObject({ phone: '600111222' })
  })

  it('no separa nombres sin conjunción ni con más de dos personas', () => {
    const { rows } = parseSheet([['Nombre'], ['María José'], ['Yolanda'], ['Ana y Luis y Eva'], ['Juan Esteban']])
    expect(rows.map((r) => [r.firstName, r.married])).toEqual([
      ['María José', false],
      ['Yolanda', false],
      ['Ana y Luis y Eva', false],
      ['Juan Esteban', false],
    ])
  })
})
