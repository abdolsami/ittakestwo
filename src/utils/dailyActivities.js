export const DAILY_ACTIVITIES = [
  { id: 'feed', title: 'a little kindness', detail: 'feed your pet a treat.', target: 1, coins: 10, destination: 'feed' },
  { id: 'games', title: 'arcade explorer', detail: 'finish rounds in two different games.', target: 2, coins: 25, destination: 'games' },
  { id: 'town', title: 'out and about', detail: 'walk the streets of town.', target: 1, coins: 10, destination: 'park' },
]

// UTC days give every device the same reset boundary. No streak penalties.
export function dailyState(state, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10)
  return state?.day === day ? state : { day, feed: 0, games: [], town: 0, claimed: [] }
}

export function activityProgress(state, id) {
  return id === 'games' ? new Set(state.games || []).size : (state[id] || 0)
}

export function recordActivity(state, id, game, now = Date.now()) {
  const current = dailyState(state, now)
  if (!DAILY_ACTIVITIES.some(activity => activity.id === id)) return current
  return id === 'games'
    ? { ...current, games: [...new Set([...(current.games || []), game].filter(Boolean))] }
    : { ...current, [id]: 1 }
}

export function claimActivity(pet, id, now = Date.now()) {
  const daily = dailyState(pet.daily, now)
  const activity = DAILY_ACTIVITIES.find(item => item.id === id)
  if (!activity || daily.claimed.includes(id) || activityProgress(daily, id) < activity.target) return pet
  return { ...pet, coins: pet.coins + activity.coins, daily: { ...daily, claimed: [...daily.claimed, id] } }
}
