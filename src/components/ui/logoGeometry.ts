/** Geometría de la «C» de nodos del logo: la comparten el logo y el loader. */
export const LOGO_TEAL = '#2DD4BF'
export const LOGO_BLUE = '#1478F0'
export const LOGO_VIEWBOX = '12 9 77 82'

const center = { x: 54, y: 50 }
const r = 30
const ANGLES = [-40, -95, -140, 180, 140, 95, 40]

export const LOGO_NODES = ANGLES.map((deg, i) => {
  const a = (deg * Math.PI) / 180
  return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a), angle: a, highlight: i === 1 || i === 5 }
})

const start = LOGO_NODES[0]!
const end = LOGO_NODES[LOGO_NODES.length - 1]!
export const LOGO_ARC = `M ${start.x} ${start.y} A ${r} ${r} 0 1 0 ${end.x} ${end.y}`
