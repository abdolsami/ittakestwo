// reward calculators. every game feeds back into the same pet state.

export const XP_PER_LEVEL = 500

// wordle: solving gives a warm bundle; losing still gives a small thank-you.
export function wordleReward(won, attemptsUsed = 6) {
  if (won) {
    // faster solves give a touch more.
    const speedBonus = Math.max(0, 6 - attemptsUsed) * 3
    return {
      happiness: 20,
      hunger: 15,
      energy: 0,
      xp: 20 + speedBonus,
      coins: 25 + speedBonus,
      message: 'you solved it!',
    }
  }
  return {
    happiness: 4,
    hunger: 3,
    energy: 0,
    xp: 5,
    coins: 5,
    message: 'thanks for playing',
  }
}

// tetris: reward scales with score and cleared lines.
export function tetrisReward(score = 0, lines = 0) {
  const coins = Math.round(score / 40) + lines * 2
  const xp = Math.round(score / 30) + lines
  const happiness = Math.min(30, Math.round(score / 120) + lines)
  const hunger = Math.min(25, Math.round(score / 200))

  let message = 'that was a good run'
  if (score >= 3000) message = 'incredible run'
  else if (score >= 1200) message = 'nice score'
  else if (score < 200) message = 'your pet earned a reward'

  return {
    happiness: Math.max(3, happiness),
    hunger: Math.max(2, hunger),
    energy: 0,
    xp: Math.max(4, xp),
    coins: Math.max(4, coins),
    message,
  }
}

// snake: reward scales with score (food eaten).
export function snakeReward(score = 0) {
  const coins = score * 2 + 4
  const xp = Math.round(score * 1.5) + 4
  const happiness = Math.min(28, score + 3)
  const hunger = Math.min(30, score * 2 + 3)

  let message = 'good game'
  if (score >= 25) message = 'amazing, so long!'
  else if (score >= 12) message = 'that was a great game'

  return {
    happiness,
    hunger,
    energy: 0,
    xp,
    coins,
    message,
  }
}

// flappy: reward scales with pipes passed.
export function flappyReward(score = 0) {
  const coins = score * 3 + 4
  const xp = score * 2 + 4
  const happiness = Math.min(28, score * 2 + 3)
  const hunger = Math.min(26, score + 3)

  let message = 'nice flying'
  if (score >= 20) message = 'incredible flight!'
  else if (score >= 10) message = 'great flying'
  else if (score < 2) message = 'watch the pipes!'

  return {
    happiness,
    hunger,
    energy: 0,
    xp,
    coins,
    message,
  }
}

// food items for the shop.
export const FOOD_ITEMS = [
  { id: 'apple', label: 'apple', emoji: '🍎', cost: 10, hunger: 15, happiness: 0 },
  { id: 'cookie', label: 'cookie', emoji: '🍪', cost: 15, hunger: 10, happiness: 5 },
  { id: 'pizza', label: 'pizza', emoji: '🍕', cost: 25, hunger: 25, happiness: 10 },
  { id: 'sushi', label: 'sushi', emoji: '🍣', cost: 40, hunger: 35, happiness: 15 },
  { id: 'cake', label: 'cake', emoji: '🍰', cost: 50, hunger: 20, happiness: 25 },
]
