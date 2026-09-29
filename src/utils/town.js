export const TOWN_ROOMS = {
  plaza: {
    name: 'willow square',
    subtitle: 'walk up to a door, a bench, or the fountain.',
    minY: 54,
    maxY: 92,
    exits: [
      { edge: 'left', to: 'west', spawn: { x: 84, y: 78 } },
      { edge: 'right', to: 'east', spawn: { x: 16, y: 78 } },
      { zone: { x: 14, y: 54, w: 8, h: 4 }, to: 'arcade', spawn: { x: 50, y: 84 } },
      { zone: { x: 46, y: 54, w: 8, h: 4 }, to: 'cafe', spawn: { x: 50, y: 84 } },
      { zone: { x: 78, y: 54, w: 8, h: 4 }, to: 'boutique', spawn: { x: 50, y: 84 } },
    ],
    spots: [
      { id: 'fountain', x: 44, y: 68, w: 12, h: 10, prompt: 'make a wish', action: 'coin' },
      { id: 'bench-l', x: 16, y: 78, w: 12, h: 8, prompt: 'sit on the bench', action: 'sit' },
      { id: 'bench-r', x: 72, y: 78, w: 12, h: 8, prompt: 'sit on the bench', action: 'sit' },
    ],
  },
  west: {
    name: 'lampwick lane',
    subtitle: 'bakeries, lamps, and the road to the pier.',
    minY: 52,
    maxY: 92,
    exits: [
      { edge: 'right', to: 'plaza', spawn: { x: 16, y: 78 } },
      { edge: 'left', to: 'dock', spawn: { x: 84, y: 80 } },
    ],
    spots: [
      { id: 'bakery', x: 18, y: 62, w: 14, h: 12, prompt: 'sniff the bakery', action: 'bakery' },
      { id: 'lamp', x: 46, y: 70, w: 10, h: 10, prompt: 'light a lamp', action: 'lamp' },
      { id: 'mail', x: 68, y: 64, w: 12, h: 10, prompt: 'check the mailbox', action: 'mail' },
    ],
  },
  east: {
    name: 'cherry row',
    subtitle: 'cottages, blossoms, and a path to the garden.',
    minY: 52,
    maxY: 92,
    exits: [
      { edge: 'left', to: 'plaza', spawn: { x: 84, y: 78 } },
      { edge: 'right', to: 'garden', spawn: { x: 16, y: 80 } },
    ],
    spots: [
      { id: 'tree', x: 28, y: 60, w: 14, h: 12, prompt: 'shake the cherry tree', action: 'cherry' },
      { id: 'knock', x: 58, y: 60, w: 14, h: 12, prompt: 'knock on a cottage', action: 'knock' },
      { id: 'swing', x: 78, y: 72, w: 12, h: 10, prompt: 'try the swing', action: 'swing' },
    ],
  },
  dock: {
    name: 'moon pier',
    subtitle: 'boards, boats, and the sound of water.',
    minY: 58,
    maxY: 92,
    exits: [
      { edge: 'right', to: 'west', spawn: { x: 16, y: 78 } },
    ],
    spots: [
      { id: 'sit-pier', x: 22, y: 72, w: 16, h: 10, prompt: 'sit on the pier', action: 'sit' },
      { id: 'boat', x: 68, y: 66, w: 16, h: 12, prompt: 'wave at the boat', action: 'boat' },
      { id: 'crate', x: 44, y: 76, w: 12, h: 10, prompt: 'peek in a crate', action: 'crate' },
    ],
  },
  garden: {
    name: 'petal park',
    subtitle: 'a quiet green at the edge of town.',
    minY: 50,
    maxY: 92,
    exits: [
      { edge: 'left', to: 'east', spawn: { x: 84, y: 78 } },
    ],
    spots: [
      { id: 'flower', x: 24, y: 70, w: 14, h: 10, prompt: 'meet the gardener', action: 'flower' },
      { id: 'pond', x: 44, y: 64, w: 16, h: 12, prompt: 'watch the pond', action: 'pond' },
      { id: 'butterfly', x: 72, y: 68, w: 14, h: 10, prompt: 'follow a butterfly', action: 'butterfly' },
    ],
  },
  arcade: {
    name: 'starlight arcade',
    subtitle: 'walk up to a cabinet to play. walk down to leave.',
    minY: 58,
    maxY: 92,
    exits: [
      { edge: 'bottom', to: 'plaza', spawn: { x: 18, y: 64 } },
    ],
    spots: [
      { id: 'wordle', x: 8, y: 62, w: 16, h: 16, prompt: 'play wordle', action: 'play:wordle' },
      { id: 'tetris', x: 26, y: 62, w: 16, h: 16, prompt: 'play tetris', action: 'play:tetris' },
      { id: 'pacman', x: 44, y: 62, w: 16, h: 16, prompt: 'play pac-man', action: 'play:pacman' },
      { id: 'snake', x: 62, y: 62, w: 16, h: 16, prompt: 'play snake', action: 'play:snake' },
      { id: 'flappy', x: 80, y: 62, w: 14, h: 16, prompt: 'play flappy', action: 'play:flappy' },
    ],
  },
  cafe: {
    name: 'mochi café',
    subtitle: 'walk to the counter to order. walk down to leave.',
    minY: 58,
    maxY: 92,
    exits: [
      { edge: 'bottom', to: 'plaza', spawn: { x: 50, y: 64 } },
    ],
    spots: [
      { id: 'counter', x: 30, y: 58, w: 40, h: 14, prompt: 'order a treat', action: 'feed' },
      { id: 'table', x: 16, y: 76, w: 16, h: 10, prompt: 'sit with a cup', action: 'sit' },
    ],
  },
  boutique: {
    name: 'paw & thread',
    subtitle: 'walk to the mirror to change your look. walk down to leave.',
    minY: 58,
    maxY: 92,
    exits: [
      { edge: 'bottom', to: 'plaza', spawn: { x: 82, y: 64 } },
    ],
    spots: [
      { id: 'mirror', x: 70, y: 58, w: 20, h: 16, prompt: 'try a new look', action: 'look' },
      { id: 'rack', x: 12, y: 60, w: 20, h: 14, prompt: 'browse the rack', action: 'rack' },
    ],
  },
}

export function roomOf(state) {
  return Object.hasOwn(TOWN_ROOMS, state?.room) ? state.room : 'plaza'
}

export function clampTownPosition(position = {}, room = 'plaza') {
  const bounds = Object.hasOwn(TOWN_ROOMS, room) ? TOWN_ROOMS[room] : TOWN_ROOMS.plaza
  return {
    x: Math.max(8, Math.min(92, Number.isFinite(position.x) ? position.x : 50)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, Number.isFinite(position.y) ? position.y : 80)),
  }
}

export function exitAt(room, position) {
  const info = Object.hasOwn(TOWN_ROOMS, room) ? TOWN_ROOMS[room] : null
  if (!info || !position) return null
  const x = position.x
  const y = position.y
  for (const exit of info.exits || []) {
    if (exit.edge === 'left' && x <= 9.5) return exit
    if (exit.edge === 'right' && x >= 90.5) return exit
    if (exit.edge === 'bottom' && y >= info.maxY - 1.2) return exit
    if (exit.edge === 'top' && y <= info.minY + 1.2) return exit
    const z = exit.zone
    if (z && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return exit
  }
  return null
}

export function spotAt(room, position) {
  const spots = Object.hasOwn(TOWN_ROOMS, room) ? TOWN_ROOMS[room].spots : []
  if (!position) return null
  return spots.find((s) => (
    position.x >= s.x && position.x <= s.x + s.w
    && position.y >= s.y && position.y <= s.y + s.h
  )) || null
}

// All destinations use the same percentage coordinates as the scene and pets.
export function exitDestination(exit, room) {
  if (exit.zone) return { x: exit.zone.x + exit.zone.w / 2, y: exit.zone.y + exit.zone.h / 2 }
  return { x: exit.edge === 'left' ? 8 : exit.edge === 'right' ? 92 : 50,
    y: exit.edge === 'bottom' ? TOWN_ROOMS[room].maxY : 80 }
}

export function stepTownWalk(state, direction, destination, seconds, canExit = true) {
  const room = roomOf(state)
  const target = destination ? clampTownPosition(destination, room) : null
  const vx = target ? target.x - state.x : direction.x
  const vy = target ? target.y - state.y : direction.y
  const length = Math.hypot(vx, vy)
  if (!length || seconds <= 0) return { state: !length && state.pose === 'walk' ? { ...state, pose: 'idle' } : state, target: length ? target : null, exit: null }
  const distance = Math.min(target ? length : Infinity, 26 * Math.min(seconds, 0.05))
  const position = clampTownPosition({ x: state.x + vx / length * distance, y: state.y + vy / length * distance }, room)
  const arrived = target && length <= distance
  const blocked = position.x === state.x && position.y === state.y
  if (blocked && state.pose === 'idle') return { state, target: null, exit: null }
  const next = { ...state, ...position, dir: vx < 0 ? 'left' : vx > 0 ? 'right' : state.dir, pose: arrived || blocked ? 'idle' : 'walk' }
  const exit = canExit ? exitAt(room, position) : null
  if (exit) return { state: { ...next, ...clampTownPosition(exit.spawn, exit.to), room: exit.to, pose: 'idle' }, target: null, exit }
  return { state: next, target: arrived || blocked ? null : target, exit: null }
}

export const GARDEN_FLOWERS = { rose: '#ff5fa2', star: '#ffd84b', moon: '#4be0e0', iris: '#a06bff' }
export const GARDENERS = ['mehreenz', 'ali']
export function gardenBedPath(identity, slot) {
  if (!GARDENERS.includes(identity) || !Number.isInteger(slot) || slot < 0 || slot > 2) return null
  return `town/garden/beds/${identity}/${slot}`
}
export function gardenBloomCount(beds, identity) {
  return [0, 1, 2].filter(slot => Object.hasOwn(GARDEN_FLOWERS, beds?.[identity]?.[slot])).length
}

export function defaultSpawn(identity, room = 'plaza') {
  if (room === 'plaza') return identity === 'mehreenz' ? { x: 28, y: 82 } : { x: 72, y: 82 }
  if (room === 'west') return { x: 70, y: 78 }
  if (room === 'east') return { x: 30, y: 78 }
  if (room === 'dock') return { x: 70, y: 80 }
  if (room === 'garden') return { x: 30, y: 80 }
  return { x: 50, y: 84 }
}
