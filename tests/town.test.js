import test from 'node:test'
import assert from 'node:assert/strict'
import { TOWN_ROOMS, clampTownPosition, defaultSpawn, exitAt, exitDestination, gardenBedPath, gardenBloomCount, roomOf, spotAt, stepTownWalk } from '../src/utils/town.js'

test('movement stays on each room floor and handles invalid coordinates', () => {
  assert.deepEqual(clampTownPosition({ x: -5, y: 20 }, 'arcade'), { x: 8, y: 58 })
  assert.deepEqual(clampTownPosition({ x: 200, y: 200 }, 'arcade'), { x: 92, y: 92 })
  assert.deepEqual(clampTownPosition({ x: NaN, y: Infinity }), { x: 50, y: 80 })
  assert.equal(roomOf({ room: 'garden' }), 'garden')
  assert.equal(roomOf({ room: 'clubhouse' }), 'plaza')
  assert.equal(roomOf({ room: 'constructor' }), 'plaza')
})

test('walking into an exit leads to the connected street or shop', () => {
  assert.equal(exitAt('plaza', { x: 8.5, y: 80 })?.to, 'west')
  assert.equal(exitAt('plaza', { x: 91.2, y: 80 })?.to, 'east')
  assert.equal(exitAt('west', { x: 91.2, y: 78 })?.to, 'plaza')
  assert.equal(exitAt('arcade', { x: 50, y: 91.2 })?.to, 'plaza')
  assert.equal(exitAt('plaza', { x: 50, y: 80 }), null)
})

test('walking up to a place can trigger a unique action', () => {
  assert.equal(spotAt('plaza', { x: 50, y: 72 })?.action, 'coin')
  assert.equal(spotAt('arcade', { x: 12, y: 68 })?.action, 'play:wordle')
  assert.equal(spotAt('plaza', { x: 50, y: 88 }), null)
})

test('all entrances, spawns, and signs agree with the walkable map', () => {
  for (const [id, room] of Object.entries(TOWN_ROOMS)) {
    assert.equal(exitAt(id, defaultSpawn('ali', id)), null, `${id} starts outside its exits`)
    for (const exit of room.exits) {
      assert.equal(exitAt(id, exitDestination(exit, id)), exit, `${id} sign reaches ${exit.to}`)
      assert.equal(exitAt(exit.to, exit.spawn), null, `${id} does not immediately send you back`)
      assert.deepEqual(clampTownPosition(exit.spawn, exit.to), exit.spawn)
    }
    for (const spot of room.spots) {
      assert.equal(spotAt(id, { x: spot.x + spot.w/2, y: spot.y + spot.h/2 }), spot)
    }
  }
})

test('click-to-walk stops at a room transition instead of following a stale destination', () => {
  const state = { x: 89.9, y: 80, room: 'plaza', dir: 'right', pose: 'walk', active: true }
  const result = stepTownWalk(state, {x:0,y:0}, {x:92,y:80}, 0.05)
  assert.equal(result.state.room, 'east')
  assert.equal(result.state.pose, 'idle')
  assert.equal(result.target, null)
  assert.equal(exitAt('east', result.state), null)
})

test('walking is frame-rate independent, normalizes diagonals, and settles at boundaries', () => {
  const initial = { x: 40, y: 80, room: 'plaza', dir: 'right', pose: 'idle' }
  const advance = frames => {
    let state = initial
    for (let frame = 0; frame < frames; frame++) state = stepTownWalk(state, {x:1,y:0}, null, 1/frames).state
    return state.x
  }
  assert.ok(Math.abs(advance(30)-advance(144)) < 0.00001)
  const diagonal = stepTownWalk(initial, {x:1,y:1}, null, .05).state
  assert.ok(Math.abs(Math.hypot(diagonal.x-initial.x, diagonal.y-initial.y)-1.3) < .00001)
  const walking = { ...initial, pose:'walk' }
  assert.equal(stepTownWalk(walking, {x:0,y:0}, initial, .016).state.pose, 'idle')
  const boundary = { ...initial, x:92, room:'garden' }
  assert.equal(stepTownWalk(boundary, {x:1,y:0}, null, .016).state, boundary)
  assert.ok(stepTownWalk(initial, {x:1,y:0}, null, 5).state.x <= 41.3)
})

test('shared flower beds have separate paths and ignore corrupt saved data', () => {
  assert.notEqual(gardenBedPath('ali',0), gardenBedPath('mehreenz',0))
  assert.equal(gardenBedPath('ali',3), null)
  assert.equal(gardenBedPath('../other',0), null)
  assert.equal(gardenBedPath('ali',.5), null)
  assert.equal(gardenBloomCount({ ali: {0:'rose',1:'moon',2:'constructor',3:'star'} }, 'ali'), 2)
  assert.equal(gardenBloomCount(null, 'ali'), 0)
})
