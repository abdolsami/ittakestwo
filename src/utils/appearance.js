import { getAnimal } from './animals'

export const COLOR_PRESETS = [
  '#f7c873', '#f2e9f7', '#c79a6b', '#e6b98f', '#f28b46',
  '#f4f4f4', '#8fd66b', '#4a5568', '#8fe3d0', '#ff5f6d',
  '#ff8ec8', '#4be0e0', '#ffd84b', '#a06bff', '#ff9f43',
  '#6be675', '#ff4d6d', '#7ec8ff', '#c084fc', '#241a3d',
]

export const ACCESSORIES = [
  { id: 'none', label: 'plain', emoji: '✨' },
  { id: 'bow', label: 'bow', emoji: '🎀' },
  { id: 'hat', label: 'party hat', emoji: '🎉' },
  { id: 'crown', label: 'crown', emoji: '👑' },
  { id: 'flower', label: 'flower', emoji: '🌸' },
  { id: 'glasses', label: 'glasses', emoji: '🤓' },
  { id: 'star', label: 'star clip', emoji: '⭐' },
  { id: 'scarf', label: 'scarf', emoji: '🧣' },
  { id: 'halo', label: 'halo', emoji: '😇' },
  { id: 'heart', label: 'heart', emoji: '💗' },
  { id: 'headphones', label: 'headphones', emoji: '🎧' },
  { id: 'ribbon', label: 'ribbon', emoji: '🎗️' },
]

export const ACCESSORY_IDS = ACCESSORIES.map((a) => a.id)
export const DEFAULT_ACCESSORY = 'none'

const clampByte = (n) => Math.max(0, Math.min(255, Math.round(n)))

export function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return null
  let h = hex.trim()
  if (h[0] !== '#') h = `#${h}`
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return null
  return h.toLowerCase()
}

function toRgb(hex) {
  const h = normalizeHex(hex) || '#f7c873'
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  }
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((x) => clampByte(x).toString(16).padStart(2, '0')).join('')}`
}

function mix(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }
}

export function derivePalette(color) {
  const body = toRgb(color)
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 20, g: 10, b: 30 }
  const pink = { r: 255, g: 143, b: 192 }
  const blush = { r: 255, g: 194, b: 224 }
  return {
    body: toHex(body),
    bodyDark: toHex(mix(body, black, 0.22)),
    bodyShade: toHex(mix(body, black, 0.38)),
    belly: toHex(mix(body, white, 0.62)),
    earIn: toHex(mix(body, blush, 0.45)),
    cheek: toHex(mix(pink, body, 0.22)),
  }
}

export function looksFor(species, color) {
  const base = getAnimal(species)
  const hex = normalizeHex(color)
  if (!hex) return base
  return { ...base, ...derivePalette(hex) }
}

export function accessoryOf(value) {
  return ACCESSORY_IDS.includes(value) ? value : DEFAULT_ACCESSORY
}

export function lookFrom(pet) {
  return {
    species: pet?.species,
    color: normalizeHex(pet?.color) || null,
    accessory: accessoryOf(pet?.accessory),
  }
}

export function accessoryLabel(id) {
  return ACCESSORIES.find((a) => a.id === id)?.label || 'plain'
}

// pixel accessory on a canvas pet whose origin is the body center.
// each piece gets a dark outline so it stays readable on any pet color.
export function drawAccessory(ctx, id, half) {
  const worn = accessoryOf(id)
  if (worn === 'none') return
  const h = Math.max(6, half)
  const paint = (x, y, w, ht, color) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(ht)))
  }
  const cluster = (pixels) => {
    for (const [x, y, w, ht] of pixels) paint(x - 1, y - 1, w + 2, ht + 2, '#241a3d')
    for (const [x, y, w, ht, color] of pixels) paint(x, y, w, ht, color)
  }

  if (worn === 'bow') {
    cluster([
      [-6, -h - 5, 5, 4, '#ff4d88'],
      [1, -h - 5, 5, 4, '#ff4d88'],
      [-2, -h - 3, 4, 4, '#ff2f74'],
      [-5, -h - 4, 2, 2, '#fff1f7'],
      [3, -h - 4, 2, 2, '#fff1f7'],
    ])
  } else if (worn === 'hat') {
    cluster([
      [-2, -h - 9, 4, 3, '#fff46a'],
      [-3, -h - 6, 6, 3, '#ff3d6e'],
      [-5, -h - 3, 10, 3, '#fff46a'],
    ])
  } else if (worn === 'crown') {
    cluster([
      [-6, -h - 1, 12, 3, '#fff46a'],
      [-6, -h - 4, 3, 3, '#fff46a'],
      [-1, -h - 6, 3, 5, '#fff46a'],
      [3, -h - 4, 3, 3, '#fff46a'],
      [-1, -h - 4, 2, 2, '#4be0e0'],
    ])
  } else if (worn === 'flower') {
    cluster([
      [-h - 2, -h, 3, 3, '#ff4d88'],
      [-h + 1, -h - 3, 3, 3, '#ff4d88'],
      [-h + 4, -h, 3, 3, '#ff4d88'],
      [-h + 1, -h, 3, 3, '#fff46a'],
    ])
  } else if (worn === 'glasses') {
    cluster([
      [-7, -3, 6, 5, '#4be0e0'],
      [1, -3, 6, 5, '#4be0e0'],
      [-1, -1, 2, 2, '#4be0e0'],
      [-6, -2, 4, 3, '#d9fbff'],
      [2, -2, 4, 3, '#d9fbff'],
    ])
  } else if (worn === 'star') {
    cluster([
      [h - 4, -h - 5, 5, 5, '#fff46a'],
      [h - 3, -h - 7, 3, 9, '#fff46a'],
      [h - 6, -h - 3, 9, 2, '#fff46a'],
      [h - 2, -h - 4, 2, 2, '#fffdf0'],
    ])
  } else if (worn === 'scarf') {
    cluster([
      [-h + 1, h - 5, h * 2 - 2, 4, '#ff3d6e'],
      [2, h - 1, 4, 5, '#ff3d6e'],
      [-h + 3, h - 4, 4, 2, '#fff46a'],
    ])
  } else if (worn === 'halo') {
    cluster([
      [-6, -h - 7, 12, 3, '#fff46a'],
      [-5, -h - 6, 10, 1, '#fffdf0'],
    ])
  } else if (worn === 'heart') {
    cluster([
      [h - 5, 0, 3, 3, '#ff3d6e'],
      [h - 1, 0, 3, 3, '#ff3d6e'],
      [h - 4, 2, 5, 4, '#ff3d6e'],
      [h - 3, 1, 2, 2, '#fff1f7'],
    ])
  } else if (worn === 'headphones') {
    cluster([
      [-h + 1, -h, h * 2 - 2, 3, '#3d4dff'],
      [-h - 2, -h + 3, 4, 6, '#ff3d6e'],
      [h - 2, -h + 3, 4, 6, '#ff3d6e'],
      [-h - 1, -h + 4, 2, 4, '#fff1f7'],
      [h - 1, -h + 4, 2, 4, '#fff1f7'],
    ])
  } else if (worn === 'ribbon') {
    cluster([
      [-4, h - 4, 8, 3, '#b44bff'],
      [-6, h - 1, 5, 4, '#b44bff'],
      [1, h - 1, 5, 4, '#b44bff'],
      [-2, h - 3, 4, 2, '#efe0ff'],
    ])
  }
}
