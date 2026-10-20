import { describe, expect, it } from 'vitest'
import es from '@/locales/es.json'
import en from '@/locales/en.json'
import it_ from '@/locales/it.json'
import fr from '@/locales/fr.json'

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
}

function placeholders(obj: object): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of keys(obj)) {
    const value = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string
    out[key] = [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
  }
  return out
}

describe('traducciones', () => {
  const base = keys(es).sort()
  it.each([
    ['en', en],
    ['it', it_],
    ['fr', fr],
  ])('%s tiene las mismas claves y variables que es', (_name, messages) => {
    expect(keys(messages).sort()).toEqual(base)
    expect(placeholders(messages)).toEqual(placeholders(es))
  })
})
