// returns a lowercase, personalized greeting based on the local time of day.

export function getTimeGreeting(name = 'mehreenz', date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return `good morning ${name} ☀️`
  }
  if (hour >= 12 && hour < 17) {
    return `good afternoon ${name}`
  }
  if (hour >= 17 && hour < 22) {
    return `good evening ${name} 🌙`
  }
  return `it's getting late ${name} 🌙`
}

// a soft, changing sub-message that depends on the pet's current mood.
export function getMoodMessage(pet) {
  if (!pet) return 'your pet is waiting for you'

  const { hunger, happiness, energy, health } = pet

  if (health < 35) {
    return 'your pet could use a little attention today'
  }
  if (hunger < 30) {
    return 'your pet is getting a little hungry'
  }
  if (energy < 25) {
    return 'your pet is feeling sleepy'
  }
  if (happiness < 35) {
    return 'your pet would love some company'
  }
  if (happiness > 80 && hunger > 70) {
    return 'your pet is feeling happy'
  }
  if (hunger > 60 && happiness > 60 && energy > 60) {
    return 'everything looks good today'
  }
  return 'your pet has been waiting for you'
}
