import test from 'node:test'
import assert from 'node:assert/strict'
import { applyTetrisPlacement, createTetrisAuthority } from './tetrisAuthority.js'

const initial = () => ({ board: Array.from({ length: 20 }, () => Array(10).fill(null)),
  round: 7, seq: 0, score: 0, lines: 0, level: 1, ack: {} })
const command = (by, x, id = 1) => ({ by, id, round: 7, points: 4,
  piece: { x, y: 18, color: by, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] } })

test('simultaneous placements serialize without losing cells or points', async () => {
  const writes = []
  let release
  const firstWrite = new Promise(resolve => { release = resolve })
  const authority = createTetrisAuthority(initial(), async state => {
    writes.push(state)
    if (writes.length === 1) await firstWrite
  })
  const a = authority.submit(command('ali', 0))
  const b = authority.submit(command('mehreenz', 6))
  await Promise.resolve()
  assert.equal(writes.length, 1)
  release()
  await a
  const state = await b
  assert.equal(state.board.flat().filter(Boolean).length, 8)
  assert.equal(state.score, 8)
  assert.equal(state.seq, 2)
  assert.deepEqual(state.ack, { ali: 1, mehreenz: 1 })
})

test('duplicate delivery and old rounds cannot mutate the board', () => {
  const state = applyTetrisPlacement(initial(), command('ali', 0))
  assert.equal(applyTetrisPlacement(state, command('ali', 0)), state)
  assert.equal(applyTetrisPlacement(state, { ...command('mehreenz', 6), round: 6 }), state)
})

test('overlapping concurrent locks request restart without overwriting cells', async () => {
  const writes = []
  const authority = createTetrisAuthority(initial(), state => { writes.push(state) })
  await authority.submit(command('ali', 0))
  const conflict = await authority.submit(command('mehreenz', 0))
  assert.equal(conflict.restart, true)
  assert.equal(conflict.board[19][0], 'ali')
  await authority.submit(command('ali', 6, 2))
  assert.equal(writes.length, 1)
})

test('line clear and next placement use latest board, scoring each clear once', () => {
  const base = initial()
  base.board[19].fill('old', 2)
  const first = applyTetrisPlacement(base, command('ali', 0))
  assert.equal(first.lines, 1)
  assert.equal(first.score, 104)
  const second = applyTetrisPlacement(first, command('mehreenz', 6))
  assert.equal(second.lines, 1)
  assert.equal(second.score, 108)
  assert.equal(second.board.flat().filter(Boolean).length, 6)
  assert.equal(base.board[19][0], null)
})

test('placement settles when a preceding clear removes its support', () => {
  const move = command('ali', 0)
  move.piece.y = 14
  const state = applyTetrisPlacement(initial(), move)
  assert.equal(state.board[19][0], 'ali')
  assert.equal(state.board[14][0], null)
})

test('failed publication retries same ID without lost placement or double scoring', async () => {
  let fail = true
  const authority = createTetrisAuthority(initial(), async () => {
    if (fail) { fail = false; throw new Error('offline') }
  })
  await assert.rejects(authority.submit(command('ali', 0)), /offline/)
  const state = await authority.submit(command('ali', 0))
  assert.equal(state.seq, 1)
  assert.equal(state.score, 4)
  assert.equal(await authority.submit(command('ali', 0)), state)
})
