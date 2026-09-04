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
    color: pet.color || null,
    accessory: pet.accessory || 'none',
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

// ---- chat presence: live typing + read receipts ----
// each person keeps a small record at chatMeta/<id>:
//   typing    – timestamp of the last keystroke (0 when not typing)
//   delivered – ts of the newest message this person has received
//   seen      – ts of the newest message this person has actually looked at
export function setChatTyping(rt, isTyping) {
  if (!rt) return
  rt.set(`chatMeta/${rt.identity}/typing`, isTyping ? Date.now() : 0)
}

export function setChatDelivered(rt, ts) {
  if (!rt || !ts) return
  rt.set(`chatMeta/${rt.identity}/delivered`, ts)
}

export function setChatSeen(rt, ts) {
  if (!rt || !ts) return
  rt.set(`chatMeta/${rt.identity}/seen`, ts)
}

// bump the shared friendship score. only the initiator calls this so it isn't
// double-counted; both screens see the new value because it's shared.
export function addFriendship(rt, kind) {
  const pts = FRIENDSHIP.points[kind] || 0
  if (rt && pts) rt.increment('friendship', pts)
}

// I'm sitting in this game right now (idle, playing, or between rounds).
// used so the other person can be asked before joining.
export function setPlaying(rt, game, state) {
  if (!rt || !game) return
  rt.set(`games/${game}/playing/${rt.identity}`, { ...state, ts: Date.now() })
}

export function clearPlaying(rt, game) {
  if (!rt || !game) return
  rt.remove(`games/${game}/playing/${rt.identity}`)
}

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

// ---- shared 2-player snake (same arena; any touch kills both) ----
export function setSnakeSession(rt, session) {
  if (!rt) return
  rt.set('games/snake/session', { ...session, ts: Date.now() })
}

// publish my live snake so my partner can see it and check collisions.
// shape: { body: [{x,y}...], food: {x,y}, dir, score, alive, round, ts }
export function setSnakePlayer(rt, state) {
  if (!rt) return
  rt.set(`games/snake/players/${rt.identity}`, { ...state, ts: Date.now() })
}

export function clearSnakePlayer(rt) {
  if (!rt) return
  rt.remove(`games/snake/players/${rt.identity}`)
}

// ---- shared 2-player tetris (one well, one falling block each) ----
export function setTetrisSession(rt, session) {
  if (!rt) return
  rt.set('games/tetris/session', { ...session, ts: Date.now() })
}

export function setTetrisPlayer(rt, state) {
  if (!rt) return
  rt.set(`games/tetris/players/${rt.identity}`, { ...state, ts: Date.now() })
}

export function clearTetrisPlayer(rt) {
  if (!rt) return
  rt.remove(`games/tetris/players/${rt.identity}`)
}

export function setTetrisBoard(rt, board) {
  if (!rt) return
  rt.set('games/tetris/board', { ...board, ts: Date.now() })
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

export function setPacmanSession(rt, session) {
  if (!rt) return
  rt.set('games/pacman/session', { ...session, ts: Date.now() })
}

export function setPacmanPlayer(rt, state) {
  if (!rt) return
  rt.set(`games/pacman/players/${rt.identity}`, { ...state, ts: Date.now() })
}

export function clearPacmanPlayer(rt) {
  if (!rt) return
  rt.remove(`games/pacman/players/${rt.identity}`)
}

export function setPacmanWorld(rt, world) {
  if (!rt) return
  rt.set('games/pacman/world', { ...world, ts: Date.now() })
}

export function clearWordleGuesses(rt) {
  if (!rt) return
  rt.remove('games/wordle/guesses')
}
