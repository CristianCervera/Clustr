import { fullName, isHead, orderMembers, type GroupMember } from './people'

export interface ExportLabels {
  title: string
  subtitle: string
  groupName: (index: number) => string
  members: (count: number) => string
  /** Marca del cabeza de un grupo («Cabeza»). */
  head: string
}

const nameWithHead = (m: GroupMember, labels: ExportLabels) => (isHead(m) ? `${fullName(m)} (${labels.head})` : fullName(m))

const idOf = (m: GroupMember) => ('id' in m ? m.id : m.personId)

/** Texto plano para pegar en un chat. */
export function groupsToText(groups: GroupMember[][], labels: ExportLabels): string {
  const blocks = groups.map((group, i) =>
    [`*${labels.groupName(i)}* (${labels.members(group.length)})`, ...orderMembers(group).map((m) => `• ${nameWithHead(m, labels)}`)].join('\n'),
  )
  return [labels.title, labels.subtitle, '', blocks.join('\n\n')].join('\n')
}

/** Nombre de archivo seguro a partir del título del reparto. */
export function fileNameOf(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return base || 'clustr'
}

const NAVY: [number, number, number] = [14, 22, 64]
const GREY: [number, number, number] = [91, 100, 120]
const BLUE: [number, number, number] = [11, 102, 228]
const TEAL: [number, number, number] = [14, 143, 126]
const CARD: [number, number, number] = [244, 246, 250]

/**
 * PDF A4 con texto real (seleccionable y nítido al imprimir). Los grupos se colocan en dos
 * columnas, siempre en la más corta; un trazo verde une a los matrimonios, como en el logo.
 */
export async function groupsToPdf(groups: GroupMember[][], labels: ExportLabels): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const page = { w: 210, h: 297, margin: 16 }
  const gap = 8
  const colW = (page.w - page.margin * 2 - gap) / 2
  const row = 6.2
  const pad = 5

  const drawHeader = () => {
    doc.setFillColor(...TEAL)
    doc.circle(page.margin + 2, page.margin + 1.2, 2.2, 'F')
    doc.setFillColor(...BLUE)
    doc.circle(page.margin + 2, page.margin + 1.2, 1.3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...NAVY)
    doc.text('Clustr', page.margin + 6, page.margin + 2.4)
    doc.setFontSize(20)
    doc.text(doc.splitTextToSize(labels.title, page.w - page.margin * 2)[0] as string, page.margin, page.margin + 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GREY)
    doc.text(labels.subtitle, page.margin, page.margin + 20.5)
    return page.margin + 30
  }

  let top = drawHeader()
  let cols = [top, top]

  groups.forEach((group, i) => {
    const members = orderMembers(group)
    const height = pad * 2 + 8 + members.length * row
    let col = cols[0]! <= cols[1]! ? 0 : 1
    if (cols[col]! + height > page.h - page.margin) {
      const other = 1 - col
      if (cols[other]! + height <= page.h - page.margin) col = other
      else {
        doc.addPage()
        top = page.margin
        cols = [top, top]
        col = 0
      }
    }
    const x = page.margin + col * (colW + gap)
    const y = cols[col]!

    doc.setFillColor(...CARD)
    doc.roundedRect(x, y, colW, height, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...BLUE)
    doc.text(labels.groupName(i), x + pad, y + pad + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GREY)
    doc.text(labels.members(members.length), x + colW - pad, y + pad + 4, { align: 'right' })

    const pairedWithNext = (j: number) => {
      const a = members[j]
      const b = members[j + 1]
      return Boolean(a?.spouseId && b && a.spouseId === idOf(b))
    }
    doc.setFontSize(10.5)
    doc.setTextColor(...NAVY)
    members.forEach((m, j) => {
      const ry = y + pad + 8 + j * row + 4
      doc.setFont('helvetica', isHead(m) ? 'bold' : 'normal')
      doc.text(doc.splitTextToSize(nameWithHead(m, labels), colW - pad * 2 - 4)[0] as string, x + pad + 4, ry)
      if (pairedWithNext(j)) {
        doc.setDrawColor(...TEAL)
        doc.setLineWidth(0.8)
        doc.line(x + pad + 1, ry - 2.6, x + pad + 1, ry + row - 1.4)
      } else if (!pairedWithNext(j - 1)) {
        doc.setFillColor(...BLUE)
        doc.circle(x + pad + 1, ry - 1.2, 0.8, 'F')
      }
    })
    cols[col] = y + height + gap
  })

  return doc.output('blob')
}

/** Captura un elemento del DOM como PNG a doble resolución. */
export async function elementToPng(element: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  const blob = await toBlob(element, { pixelRatio: 2, cacheBust: true })
  if (!blob) throw new Error('No se ha podido generar la imagen')
  return blob
}

export function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Comparte con la hoja nativa del sistema si puede; si no, descarga el archivo. */
export async function shareOrDownload(blob: Blob, fileName: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], fileName, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  download(blob, fileName)
  return 'downloaded'
}
