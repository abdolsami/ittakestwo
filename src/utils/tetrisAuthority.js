// One outstanding command per player; only the host writes board snapshots.
// The acknowledgement and board are committed together, so replay is harmless.
export function applyTetrisPlacement(state, command) {
  if (state.restart) return state
  if (!command || command.round !== state.round ||
      !['ali', 'mehreenz'].includes(command.by) ||
      !Number.isSafeInteger(command.id) || command.id <= 0 ||
      command.id <= (state.ack[command.by] || 0)) return state
  const piece = command.piece
  if (!piece || piece.cells?.length !== 4 || !Number.isInteger(piece.x) ||
      !Number.isInteger(piece.y) || typeof piece.color !== 'string' ||
      !Number.isSafeInteger(command.points) || command.points < 0) return state
  const board = state.board.map(row => [...row])
  const cells = piece.cells.map(([x, y]) => [x + piece.x, y + piece.y])
  if (cells.some(([x, y]) => !Number.isInteger(x) || !Number.isInteger(y) ||
      x < 0 || x >= 10 || y < 0 || y >= 20) ||
      new Set(cells.map(([x, y]) => `${x},${y}`)).size !== 4) return state
  if (cells.some(([x, y]) => board[y][x])) return { ...state, restart: true }
  // A preceding line clear can remove the support seen by the sender.
  while (cells.every(([x, y]) => y + 1 < 20 && !board[y + 1][x])) {
    cells.forEach(cell => { cell[1]++ })
  }
  for (const [x, y] of cells) board[y][x] = piece.color
  const remaining = board.filter(row => !row.every(Boolean))
  const cleared = 20 - remaining.length
  while (remaining.length < 20) remaining.unshift(Array(10).fill(null))
  const lines = state.lines + cleared
  return {
    ...state, board: remaining, seq: state.seq + 1,
    score: state.score + command.points + [0, 100, 300, 500, 800][cleared] * state.level,
    lines, level: Math.floor(lines / 10) + 1,
    ack: { ...state.ack, [command.by]: command.id },
  }
}

// Serialize writes, including asynchronous Firebase acknowledgements. A failed
// write leaves state unchanged and can be retried with the same command ID.
export function createTetrisAuthority(initial, write) {
  let state = initial
  let tail = Promise.resolve()
  return {
    submit(command) {
      const result = tail.then(async () => {
        const next = applyTetrisPlacement(state, command)
        if (next === state) return next
        if (next.restart) { state = next; return next }
        await write(next)
        state = next
        return state
      })
      tail = result.catch(() => {})
      return result
    },
  }
}
