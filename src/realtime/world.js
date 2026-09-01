// high-level world actions built on top of the realtime api (rt = useRealtime()).
// keeping them here means components stay small and the data shape lives in one
// place.

import { FRIENDSHIP } from '../utils/social'

// publish a public snapshot of my pet so my partner can see it.
export function publishPet(rt, pet, mood) {
  if (!rt || !pet) return
  rt.set(`pets/${rt.identity}`, {
    name: pet.name || rt.identity,
    species: pet.species || null,
    mood,
    level: pet.level,
    hunger: Math.round(pet.hunger),
    happiness: Math.round(pet.happiness),
    energy: Math.round(pet.energy),
    health: Math.round(pet.health),
    ts: Date.now(),
  })
}

// publish my pet's live position / pose in the park.
export function setParkState(rt, state) {
  if (!rt) return
  rt.set(`park/${rt.identity}`, { ...state, ts: Date.now() })
}

// fire a one-off interaction event both people will react to.
export function emitEvent(rt, event) {
  if (!rt) return null
  return rt.push('events', { ...event, from: rt.identity, ts: Date.now() })
}

export function sendChat(rt, text) {
  const clean = String(text).trim().slice(0, 300)
  if (!rt || !clean) return
  rt.push('chat', { from: rt.identity, text: clean, ts: Date.now() })
}

// bump the shared friendship score. only the initiator calls this so it isn't
// double-counted; both screens see the new value because it's shared.
export function addFriendship(rt, kind) {
  const pts = FRIENDSHIP.points[kind] || 0
  if (rt && pts) rt.increment('friendship', pts)
}

// ---- live head-to-head play ----
// publish my live state for a game so my partner sees our scores race in
// realtime. shape: { score, status: 'playing' | 'done', name, ts }
export function setGameLive(rt, game, state) {
  if (!rt || !game) return
  rt.set(`games/${game}/live/${rt.identity}`, { ...state, ts: Date.now() })
}

export function clearGameLive(rt, game) {
  if (!rt || !game) return
  rt.remove(`games/${game}/live/${rt.identity}`)
}

// ---- shared game session (used by the 2-player flappy world) ----
export function setFlappySession(rt, session) {
  if (!rt) return
  rt.set('games/flappy/session', { ...session, ts: Date.now() })
}

export function setFlappyBird(rt, bird) {
  if (!rt) return
  rt.set(`games/flappy/birds/${rt.identity}`, { ...bird, ts: Date.now() })
}

export function clearFlappyBird(rt) {
  if (!rt) return
  rt.remove(`games/flappy/birds/${rt.identity}`)
}

// ---- shared co-op wordle (both people solve ONE board together) ----
// the shared word comes from session.seed; guesses are a shared list; the
// in-progress row is shared live so each person sees the other typing.
export function setWordleSession(rt, session) {
  if (!rt) return
  rt.set('games/wordle/session', { ...session, ts: Date.now() })
}

export function setWordleCurrent(rt, text, round) {
  if (!rt) return
  rt.set('games/wordle/current', { text, by: rt.identity, round, ts: Date.now() })
}

export function pushWordleGuess(rt, word, round) {
  if (!rt) return
  rt.push('games/wordle/guesses', { word, by: rt.identity, round, ts: Date.now() })
}

export function clearWordleGuesses(rt) {
  if (!rt) return
  rt.remove('games/wordle/guesses')
}
