// gentle stat decay based on elapsed time. the pet never dies permanently.

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v))

// decay rates are expressed per hour, kept intentionally soft.
const DECAY_PER_HOUR = {
  hunger: 4,
  happiness: 3,
  energy: 2.5,
}

// cap how much decay can happen while away so a long absence is forgiving.
const MAX_DECAY_HOURS = 18

export function applyDecay(pet, now = Date.now()) {
  if (!pet || !pet.lastVisit) return pet

  const elapsedMs = now - pet.lastVisit
  if (elapsedMs <= 0) return pet

  const hours = Math.min(elapsedMs / (1000 * 60 * 60), MAX_DECAY_HOURS)
  if (hours < 0.01) return pet

  const hunger = clamp(pet.hunger - DECAY_PER_HOUR.hunger * hours)
  const happiness = clamp(pet.happiness - DECAY_PER_HOUR.happiness * hours)
  // energy slowly recovers while away (the pet rests), but only a little.
  const energy = clamp(pet.energy + 1.5 * hours)

  // health softly follows how well fed and happy the pet is.
  const care = (hunger + happiness) / 2
  let health = pet.health
  if (care < 30) {
    health = clamp(pet.health - 2 * hours)
  } else if (care > 70) {
    health = clamp(pet.health + 1.5 * hours)
  }
  // health floor so the pet always bounces back.
  health = clamp(health, 10)

  return {
    ...pet,
    hunger,
    happiness,
    energy,
    health,
    lastVisit: now,
  }
}

// count whole days since the starting date.
export function daysAlive(startDate, now = Date.now()) {
  if (!startDate) return 0
  const days = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}
