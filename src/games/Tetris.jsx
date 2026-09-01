import { useCallback, useEffect, useRef, useState } from 'react'
import { tetrisReward } from '../utils/rewards'
import './games.css'

const COLS = 10
const ROWS = 20
const CELL = 24
const NEXT_CELL = 18

const SHAPES = {
  I: { color: '#4be0e0', cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { color: '#ffd84b', cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
  T: { color: '#a06bff', cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { color: '#6be675', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { color: '#ff5f6d', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { color: '#5f8dff', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { color: '#ff9f43', cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
}
const TYPES = Object.keys(SHAPES)

function rotateCells(cells) {
  // rotate 90deg clockwise within bounding box.
  return cells.map(([x, y]) => [-y, x])
}

function normalize(cells) {
  const minX = Math.min(...cells.map((c) => c[0]))
  const minY = Math.min(...cells.map((c) => c[1]))
  return cells.map(([x, y]) => [x - minX, y - minY])
}

function randomPiece() {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)]
  const base = SHAPES[type]
  return { type, color: base.color, cells: base.cells.map((c) => [...c]), x: 3, y: 0 }
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

export default function Tetris({ onExit, onFinish, highScore, onScore }) {
  const canvasRef = useRef(null)
  const nextCanvasRef = useRef(null)
  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore
  const reportScore = (v) => onScoreRef.current && onScoreRef.current(v)

  const boardRef = useRef(emptyBoard())
  const pieceRef = useRef(randomPiece())
  const nextRef = useRef(randomPiece())
  const dropTimerRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)
  const runningRef = useRef(true)
  const finishedRef = useRef(false)
  // when set, the active piece is rapidly falling to this row (hard drop anim).
  const fastDropRef = useRef(null)
  const fastTimerRef = useRef(0)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [reward, setReward] = useState(null)
  const [best, setBest] = useState(highScore || 0)

  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const levelRef = useRef(1)

  const dropInterval = () => Math.max(90, 800 - (levelRef.current - 1) * 70)

  const collides = useCallback((piece, board, dx = 0, dy = 0, cells = null) => {
    const cs = cells || piece.cells
    for (const [cx, cy] of cs) {
      const nx = piece.x + cx + dx
      const ny = piece.y + cy + dy
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
    return false
  }, [])

  const lockPiece = useCallback(() => {
    const piece = pieceRef.current
    const board = boardRef.current
    for (const [cx, cy] of piece.cells) {
      const nx = piece.x + cx
      const ny = piece.y + cy
      if (ny >= 0) board[ny][nx] = piece.color
    }
    // clear full lines.
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((c) => c)) {
        board.splice(r, 1)
        board.unshift(Array(COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * levelRef.current
      scoreRef.current += points
      linesRef.current += cleared
      setScore(scoreRef.current)
      reportScore(scoreRef.current)
      setLines(linesRef.current)
      const newLevel = Math.floor(linesRef.current / 10) + 1
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel
        setLevel(newLevel)
      }
    }

    // spawn next.
    pieceRef.current = nextRef.current
    nextRef.current = randomPiece()

    // game over check.
    if (collides(pieceRef.current, boardRef.current, 0, 0)) {
      runningRef.current = false
      setGameOver(true)
    }
  }, [collides])

  const endGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const isHigh = scoreRef.current > (highScore || 0)
    setBest(Math.max(highScore || 0, scoreRef.current))
    const r = tetrisReward(scoreRef.current, linesRef.current)
    setReward({ ...r, isHigh })
    onFinish(r, scoreRef.current, isHigh)
  }, [highScore, onFinish])

  useEffect(() => {
    if (gameOver) endGame()
  }, [gameOver, endGame])

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const piece = nextRef.current
    const cells = normalize(piece.cells)
    const w = Math.max(...cells.map((c) => c[0])) + 1
    const h = Math.max(...cells.map((c) => c[1])) + 1
    const ox = (canvas.width - w * NEXT_CELL) / 2
    const oy = (canvas.height - h * NEXT_CELL) / 2
    for (const [cx, cy] of cells) {
      drawCell(ctx, ox + cx * NEXT_CELL, oy + cy * NEXT_CELL, NEXT_CELL, piece.color)
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // grid lines
    ctx.strokeStyle = 'rgba(160,107,255,0.08)'
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke()
    }

    const board = boardRef.current
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c])
      }
    }

    // ghost piece
    const piece = pieceRef.current
    let ghostY = 0
    while (!collides(piece, board, 0, ghostY + 1)) ghostY++
    ctx.globalAlpha = 0.22
    for (const [cx, cy] of piece.cells) {
      const nx = piece.x + cx
      const ny = piece.y + cy + ghostY
      if (ny >= 0) drawCell(ctx, nx * CELL, ny * CELL, CELL, piece.color)
    }
    ctx.globalAlpha = 1

    // active piece
    for (const [cx, cy] of piece.cells) {
      const nx = piece.x + cx
      const ny = piece.y + cy
      if (ny >= 0) drawCell(ctx, nx * CELL, ny * CELL, CELL, piece.color)
    }
  }, [collides])

  // main loop: keeps running continuously, only advances when running.
  useEffect(() => {
    const step = (time) => {
      const last = lastTimeRef.current || time
      const delta = time - last
      lastTimeRef.current = time

      if (runningRef.current) {
        if (fastDropRef.current != null) {
          // animate the hard drop: step down a row every ~16ms so it visibly
          // falls instead of teleporting, then lock at the bottom.
          const STEP_MS = 16
          fastTimerRef.current += delta
          while (fastTimerRef.current >= STEP_MS && fastDropRef.current != null) {
            fastTimerRef.current -= STEP_MS
            const piece = pieceRef.current
            if (piece.y < fastDropRef.current && !collides(piece, boardRef.current, 0, 1)) {
              piece.y++
            } else {
              fastDropRef.current = null
              fastTimerRef.current = 0
              lockPiece()
            }
          }
        } else {
          dropTimerRef.current += delta
          if (dropTimerRef.current > dropInterval()) {
            dropTimerRef.current = 0
            const piece = pieceRef.current
            if (!collides(piece, boardRef.current, 0, 1)) {
              piece.y++
            } else {
              lockPiece()
            }
          }
        }
      }
      draw()
      drawNext()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [collides, lockPiece, draw, drawNext])

  const move = useCallback((dx) => {
    if (fastDropRef.current != null) return
    const piece = pieceRef.current
    if (!collides(piece, boardRef.current, dx, 0)) { piece.x += dx; draw() }
  }, [collides, draw])

  const softDrop = useCallback(() => {
    if (fastDropRef.current != null) return
    const piece = pieceRef.current
    if (!collides(piece, boardRef.current, 0, 1)) {
      piece.y++
      scoreRef.current += 1
      setScore(scoreRef.current)
      reportScore(scoreRef.current)
      dropTimerRef.current = 0
      draw()
    } else {
      lockPiece()
      draw()
    }
  }, [collides, draw, lockPiece])

  const hardDrop = useCallback(() => {
    if (fastDropRef.current != null) return
    const piece = pieceRef.current
    let dist = 0
    while (!collides(piece, boardRef.current, 0, dist + 1)) dist++
    if (dist <= 0) { lockPiece(); draw(); return }
    // score the drop up front, then let the RAF loop animate the fall.
    scoreRef.current += dist * 2
    setScore(scoreRef.current)
    reportScore(scoreRef.current)
    fastDropRef.current = piece.y + dist
    fastTimerRef.current = 0
  }, [collides, draw, lockPiece])

  const rotate = useCallback(() => {
    if (fastDropRef.current != null) return
    const piece = pieceRef.current
    if (piece.type === 'O') return
    const rotated = normalize(rotateCells(piece.cells))
    // wall kicks: try a few offsets.
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!collides(piece, boardRef.current, dx, 0, rotated)) {
        piece.cells = rotated
        piece.x += dx
        draw()
        return
      }
    }
  }, [collides, draw])

  useEffect(() => {
    const handler = (e) => {
      if (!runningRef.current) return
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); move(-1); break
        case 'ArrowRight': e.preventDefault(); move(1); break
        case 'ArrowDown': e.preventDefault(); softDrop(); break
        case 'ArrowUp': e.preventDefault(); rotate(); break
        case ' ': e.preventDefault(); hardDrop(); break
        default: break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [move, softDrop, hardDrop, rotate])

  const restart = () => {
    boardRef.current = emptyBoard()
    pieceRef.current = randomPiece()
    nextRef.current = randomPiece()
    scoreRef.current = 0
    linesRef.current = 0
    levelRef.current = 1
    dropTimerRef.current = 0
    lastTimeRef.current = 0
    fastDropRef.current = null
    fastTimerRef.current = 0
    finishedRef.current = false
    runningRef.current = true
    setScore(0); setLines(0); setLevel(1); setGameOver(false); setReward(null)
    reportScore(0)
  }

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">tetris</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      <div className="tetris-layout">
        <canvas
          ref={canvasRef}
          className="canvas-stage"
          width={COLS * CELL}
          height={ROWS * CELL}
        />
        <div className="tetris-side">
          <div className="side-box">
            <div className="k">next</div>
            <canvas ref={nextCanvasRef} width={5 * NEXT_CELL} height={4 * NEXT_CELL} style={{ marginTop: 8 }} />
          </div>
          <div className="side-box"><div className="k">score</div><div className="v">{score}</div></div>
          <div className="side-box"><div className="k">lines</div><div className="v">{lines}</div></div>
          <div className="side-box"><div className="k">level</div><div className="v">{level}</div></div>
        </div>
      </div>

      <div className="mobile-controls">
        <div className="dpad">
          <button onClick={rotate}>⟳</button>
          <button onClick={hardDrop}>⤓</button>
          <button onClick={() => softDrop()}>↓</button>
          <button onClick={() => move(-1)}>←</button>
          <button onClick={() => softDrop()}>·</button>
          <button onClick={() => move(1)}>→</button>
        </div>
      </div>

      <p className="hint center">arrows to move · up to rotate · space to hard drop</p>

      {gameOver && reward && (
        <div className="overlay">
          <div className="game-over-card">
            <div className="go-title">{reward.isHigh ? 'new high score' : 'game over'}</div>
            <div className="go-msg">{reward.message}<br />final score <b style={{ color: 'var(--cyan)' }}>{score}</b></div>
            <div className="reward-list">
              <span className="chip chip-xp">+{reward.xp} xp</span>
              <span className="chip chip-coins">+{reward.coins} coins</span>
              <span className="chip chip-happiness" style={{ color: 'var(--pink)' }}>+{reward.happiness} happy</span>
              <span className="chip chip-games" style={{ color: 'var(--yellow)' }}>+{reward.hunger} food</span>
            </div>
            <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button className="btn btn-cyan" onClick={restart}>play again</button>
              <button className="btn btn-purple" onClick={onExit}>back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function drawCell(ctx, x, y, size, color) {
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x + 1, y + 1, size - 2, 3)
  ctx.fillRect(x + 1, y + 1, 3, size - 2)
  // shade
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x + 1, y + size - 4, size - 2, 3)
  ctx.fillRect(x + size - 4, y + 1, 3, size - 2)
}
