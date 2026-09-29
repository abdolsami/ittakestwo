import test from 'node:test'
import assert from 'node:assert/strict'
import { applyDecay } from '../src/utils/petDecay.js'
import { claimActivity, dailyState, recordActivity, activityProgress } from '../src/utils/dailyActivities.js'
import { LocalClient } from '../src/realtime/localClient.js'

const now = Date.UTC(2026, 8, 6, 12)
const pet = { hunger: 75, happiness: 70, energy: 80, health: 90, lastVisit: now }

test('live decay retains fractional changes and matches elapsed time', () => {
  let stepped = pet
  for (let i = 1; i <= 120; i++) stepped = applyDecay(stepped, now + i * 30000, true)
  const hourly = applyDecay(pet, now + 3600000, true)
  for (const stat of ['hunger', 'happiness', 'energy']) assert.ok(Math.abs(stepped[stat] - hourly[stat]) < 1e-8)
  assert.ok(stepped.hunger < pet.hunger)
})

test('absence is forgiving and clock rollback does not reward stats', () => {
  const away = applyDecay(pet, now + 1000 * 3600000)
  assert.ok(away.health >= 10)
  assert.equal(away.hunger, 3)
  assert.equal(applyDecay(pet, now - 1), pet)
})

test('daily rewards require distinct games and cannot be claimed twice', () => {
  let daily = recordActivity(null, 'games', 'snake', now)
  daily = recordActivity(daily, 'games', 'snake', now)
  assert.equal(activityProgress(daily, 'games'), 1)
  const initial = { coins: 30, daily }
  assert.equal(claimActivity(initial, 'games', now), initial)
  daily = recordActivity(daily, 'games', 'tetris', now)
  const rewarded = claimActivity({ coins: 30, daily }, 'games', now)
  assert.equal(rewarded.coins, 55)
  assert.equal(claimActivity(rewarded, 'games', now), rewarded)
  assert.equal(dailyState(daily, now + 86400000).games.length, 0)
})

test('parent subscriptions receive immutable snapshots when children change', () => {
  const storage = new Map()
  globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } }
  const client = new LocalClient()
  try {
    const snapshots = []
    client.watch('chat', value => snapshots.push(value))
    client.set('chat/one', { text: 'Hello' })
    client.set('chat/two', { text: 'Hi' })
    assert.notEqual(snapshots[1], snapshots[2])
    assert.equal(snapshots[1].two, undefined)
    assert.equal(snapshots[2].two.text, 'Hi')
    snapshots[2].one.text = 'tampered'
    let original
    client.watch('chat/one', value => { original = value.text })
    assert.equal(original, 'Hello')
  } finally {
    client.destroy()
    delete globalThis.window
  }
})
