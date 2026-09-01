// shared social constants for the mehreenz + ali world:
// friendship scoring, gifts, activities and the cute messages.

export const FRIENDSHIP = {
  perLevel: 20,
  maxLevel: 5,
  points: {
    meet: 2,
    hi: 3,
    play: 5,
    sit: 4,
    sleep: 3,
    gift: 6,
    game: 20,
  },
}

export function friendshipLevel(points) {
  return Math.min(FRIENDSHIP.maxLevel, Math.floor((points || 0) / FRIENDSHIP.perLevel) + 1)
}

export function friendshipProgress(points) {
  const p = points || 0
  const into = p % FRIENDSHIP.perLevel
  return Math.round((into / FRIENDSHIP.perLevel) * 100)
}

// what each friendship level unlocks.
export const UNLOCKS = {
  hi: 1,
  play: 2,
  sit: 3,
  gift: 4,
  special: 5,
}

export const GIFTS = [
  { id: 'apple', emoji: '🍎', label: 'apple', hunger: 12, happiness: 4 },
  { id: 'flower', emoji: '🌷', label: 'flower', hunger: 0, happiness: 10 },
  { id: 'cookie', emoji: '🍪', label: 'cookie', hunger: 10, happiness: 8 },
  { id: 'present', emoji: '🎁', label: 'little present', hunger: 4, happiness: 14 },
  { id: 'star', emoji: '⭐', label: 'star', hunger: 0, happiness: 16 },
]

export function giftById(id) {
  return GIFTS.find((g) => g.id === id) || GIFTS[0]
}

export const MEET_MESSAGES = [
  'your pets found each other',
  'look who is here',
  'your pets are happy to see each other',
  'your pets are hanging out',
  'your pets are friends now',
]

export function randomMeet() {
  return MEET_MESSAGES[Math.floor(Math.random() * MEET_MESSAGES.length)]
}

// occasional shared "special moments" that only happen when both are online.
export const SPECIAL_MOMENTS = [
  { id: 'butterfly', text: 'your pets chase a butterfly 🦋' },
  { id: 'gaze', text: 'your pets look at the same star ✨' },
  { id: 'sit', text: 'your pets sit together on the bench 🪑' },
  { id: 'sleep', text: 'your pets take a tiny nap 💤' },
  { id: 'walk', text: 'your pets walk toward each other 😊' },
]
