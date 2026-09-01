// short, cute descriptions of a pet's mood, reused across screens.

export function feeling(mood) {
  switch (mood) {
    case 'excited': return 'feeling wonderful'
    case 'happy': return 'feeling happy'
    case 'hungry': return 'a little hungry'
    case 'tired': return 'feeling sleepy'
    case 'sad': return 'in need of some love'
    default: return 'doing okay'
  }
}

export function moodLine(mood) {
  switch (mood) {
    case 'excited': return 'your pet is feeling wonderful'
    case 'happy': return 'your pet is happy'
    case 'hungry': return 'your pet is getting a little hungry'
    case 'tired': return 'your pet is feeling sleepy'
    case 'sad': return 'your pet could use a little attention today'
    default: return 'everything looks good today'
  }
}

// derive a mood from a plain snapshot (partner's pet has no usePet hook).
export function moodFromSnapshot(p) {
  if (!p) return 'happy'
  if (p.mood) return p.mood
  if (p.energy < 25) return 'tired'
  if (p.hunger < 30) return 'hungry'
  if (p.happiness > 85 && p.hunger > 60) return 'excited'
  if (p.happiness < 35 || p.health < 40) return 'sad'
  return 'happy'
}
