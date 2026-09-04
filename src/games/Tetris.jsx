import { useCallback, useEffect, useRef, useState } from 'react'
import { tetrisReward } from '../utils/rewards'
import { isTypingInField } from '../utils/keys'
import { useRealtime, useWatch, useWatchRef, usePartnerOnline } from '../realtime/RealtimeContext'
import { usePlayTogether } from '../hooks/usePlayTogether'
import { useGameLoop } from '../hooks/useGameLoop'
import { shouldPublish } from '../utils/publish'
import { get2d, makeLayer } from '../utils/canvas'
import PlayInvite from '../components/PlayInvite'
import {
  setTetrisSession, setTetrisPlayer, clearTetrisPlayer, setTetrisBoard,
} from '../realtime/world'
import './games.css'

const COLS = 10
const ROWS = 20
const CELL = 24
const NEXT_CELL = 18
const COUNTDOWN = 1600

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
  return cells.map(([x, y]) => [-y, x])
}

function normalize(cells) {
  const minX = Math.min(...cells.map((c) => c[0]))
  const minY = Math.min(...cells.map((c) => c[1]))
  return cells.map(([x, y]) => [x - minX, y - minY])
}

function spawnX(identity, duo) {
  if (!duo) return 3
  return identity === 'ali' ? 6 : 1
}

function randomPiece(identity, duo) {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)]
  const base = SHAPES[type]
  return { type, color: base.color, cells: base.cells.map((c) => [...c]), x: spawnX(identity, duo), y: 0 }
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function packPiece(p) {
  if (!p) return null
  return {
    type: p.type,
    color: p.color,
    x: p.x,
    y: p.y,
    cells: p.cells.map(([x, y]) => ({ x, y })),
  }
}

function unpackPiece(p) {
  if (!p) return null
  const raw = Array.isArray(p.cells) ? p.cells : Object.values(p.cells || {})
  const cells = raw.map((c) => (Array.isArray(c) ? [c[0], c[1]] : [c.x, c.y]))
  return { type: p.type, color: p.color, x: p.x, y: p.y, cells }
}

function packBoard(board) {
  const filled = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) filled.push({ r, c, color: board[r][c] })
    }
  }
  return filled
}

function unpackBoard(filled) {
  const board = emptyBoard()
  const list = Array.isArray(filled) ? filled : Object.values(filled || {})
  for (const cell of list) {
    if (!cell || cell.r == null || cell.c == null) continue
    if (cell.r >= 0 && cell.r < ROWS && cell.c >= 0 && cell.c < COLS) board[cell.r][cell.c] = cell.color
  }
  return board
}

export default function Tetris({ onExit, onFinish, highScore }) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const { ask, together, solo, playTogether, playSolo } = usePlayTogether('tetris')
  const session = useWatch('games/tetris/session')
  const partnerRef = useWatchRef(`games/tetris/players/${partner}`)
  const boardWatchRef = useWatchRef('games/tetris/board')

  const canvasRef = useRef(null)
  const nextCanvasRef = useRef(null)

  const boardRef = useRef(emptyBoard())
  const pieceRef = useRef(null)
  const nextRef = useRef(randomPiece(rt.identity, false))
  const dropTimerRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastPayloadRef = useRef('')
  const runningRef = useRef(false)
  const finishedRef = useRef(false)
  const fastDropRef = useRef(null)
  const fastTimerRef = useRef(0)
  const roundRef = useRef(0)
  const startAtRef = useRef(null)
  const seqRef = useRef(0)
  const lastPubRef = useRef(0)
  const duoRef = useRef(false)
  const partnerOnlineRef = useRef(partnerOnline)
  partnerOnlineRef.current = partnerOnline

  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [reward, setReward] = useState(null)
  const [best, setBest] = useState(highScore || 0)

  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const levelRef = useRef(1)

  const dropInterval = () => Math.max(90, 800 - (levelRef.current - 1) * 70)

  const partnerCells = useCallback(() => {
    if (!duoRef.current) return []
    const p = partnerRef.current
    if (!p || p.round !== roundRef.current || !p.piece || p.alive === false) return []
    const piece = unpackPiece(p.piece)
    if (!piece) return []
    return piece.cells.map(([cx, cy]) => [piece.x + cx, piece.y + cy])
  }, [])

  const hitsBoard = useCallback((piece, board, dx = 0, dy = 0, cells = null) => {
    const cs = cells || piece.cells
    for (const [cx, cy] of cs) {
      const nx = piece.x + cx + dx
      const ny = piece.y + cy + dy
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
    return false
  }, [])

  const hitsPartner = useCallback((piece, dx = 0, dy = 0, cells = null) => {
    const cs = cells || piece.cells
    const blocked = partnerCells()
    if (!blocked.length) return false
    return cs.some(([cx, cy]) => blocked.some(([bx, by]) => bx === piece.x + cx + dx && by === piece.y + cy + dy))
  }, [partnerCells])

  const pieceOverlapsBoard = useCallback((piece, board, cells = null) => {
    const cs = cells || piece.cells
    for (const [cx, cy] of cs) {
      const nx = piece.x + cx
      const ny = piece.y + cy
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && board[ny][nx]) return true
    }
    return false
  }, [])

  // movement only cares about walls / floor / locked cells.
  // the other person's falling piece is pass-through.
  const collides = useCallback((piece, board, dx = 0, dy = 0, cells = null) => (
    hitsBoard(piece, board, dx, dy, cells)
  ), [hitsBoard])

  const startRoundRef = useRef(() => {})
  const overlapRestartingRef = useRef(false)

  const restartFromOverlap = useCallback(() => {
    if (!duoRef.current || overlapRestartingRef.current) return
    overlapRestartingRef.current = true
    startRoundRef.current()
  }, [])

  const publishMe = useCallback((force) => {
    if (!duoRef.current) return
    const now = Date.now()
    if (!force && now - lastPubRef.current < 40) return
    lastPubRef.current = now
    const payload = {
      piece: packPiece(pieceRef.current),
      next: packPiece(nextRef.current),
      score: scoreRef.current,
      lines: linesRef.current,
      alive: runningRef.current,
      round: roundRef.current,
    }
    if (!force && !shouldPublish(lastPayloadRef, payload)) return
    setTetrisPlayer(rt, payload)
  }, [rt])

  const publishBoard = useCallback(() => {
    if (!duoRef.current) return
    seqRef.current += 1
    setTetrisBoard(rt, {
      cells: packBoard(boardRef.current),
      score: scoreRef.current,
      lines: linesRef.current,
      level: levelRef.current,
      seq: seqRef.current,
      round: roundRef.current,
    })
  }, [rt])

  const lockPiece = useCallback(() => {
    const piece = pieceRef.current
    if (!piece) return
    if (duoRef.current && (hitsPartner(piece, 0, 0) || pieceOverlapsBoard(piece, boardRef.current))) {
      restartFromOverlap()
      return
    }
    const board = boardRef.current
    for (const [cx, cy] of piece.cells) {
      const nx = piece.x + cx
      const ny = piece.y + cy
      if (ny >= 0) board[ny][nx] = piece.color
    }
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
      setLines(linesRef.current)
      const newLevel = Math.floor(linesRef.current / 10) + 1
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel
        setLevel(newLevel)
      }
    }

    const duo = duoRef.current
    pieceRef.current = nextRef.current
    pieceRef.current.x = spawnX(rt.identity, duo)
    pieceRef.current.y = 0
    nextRef.current = randomPiece(rt.identity, duo)
    publishBoard()

    if (hitsBoard(pieceRef.current, boardRef.current, 0, 0)) {
      runningRef.current = false
      setPhase('over')
    }
    publishMe(true)
  }, [hitsBoard, hitsPartner, pieceOverlapsBoard, publishBoard, publishMe, restartFromOverlap, rt.identity])

  const endGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    runningRef.current = false
    const isHigh = scoreRef.current > (highScore || 0)
    setBest(Math.max(highScore || 0, scoreRef.current))
    setScore(scoreRef.current)
    setLines(linesRef.current)
    setLevel(levelRef.current)
    const r = tetrisReward(scoreRef.current, linesRef.current)
    setReward({ ...r, isHigh })
    onFinish(r, scoreRef.current, isHigh)
    publishMe(true)
  }, [highScore, onFinish, publishMe])

  useEffect(() => {
    if (phase === 'over') endGame()
  }, [phase, endGame])

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = get2d(canvas)
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const piece = nextRef.current
    if (!piece) return
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
    const ctx = get2d(canvas)
    ctx.drawImage(tetrisGridLayer(), 0, 0)
    ctx.drawImage(tetrisBoardLayer(boardRef.current, seqRef.current), 0, 0)

    const board = boardRef.current

    const drawGhost = (piece, alpha) => {
      if (!piece) return
      let ghostY = 0
      while (!collides(piece, board, 0, ghostY + 1)) ghostY++
      ctx.globalAlpha = alpha
      for (const [cx, cy] of piece.cells) {
        const nx = piece.x + cx
        const ny = piece.y + cy + ghostY
        if (ny >= 0) drawCell(ctx, nx * CELL, ny * CELL, CELL, piece.color)
      }
      ctx.globalAlpha = 1
    }

    const drawPiece = (piece) => {
      if (!piece) return
      for (const [cx, cy] of piece.cells) {
        const nx = piece.x + cx
        const ny = piece.y + cy
        if (ny >= 0) drawCell(ctx, nx * CELL, ny * CELL, CELL, piece.color)
      }
    }

    const piece = pieceRef.current
    if (piece) {
      drawGhost(piece, 0.22)
      drawPiece(piece)
    }

    const pp = partnerRef.current
    if (duoRef.current && pp && pp.round === roundRef.current && pp.piece && pp.alive !== false) {
      ctx.globalAlpha = 0.62
      drawPiece(unpackPiece(pp.piece))
      ctx.globalAlpha = 1
    }

    if (startAtRef.current != null && Date.now() < startAtRef.current && phase === 'running') {
      const remain = Math.ceil((startAtRef.current - Date.now()) / (COUNTDOWN / 3))
      ctx.fillStyle = 'rgba(0,0,0,0.42)'
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 64px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(String(Math.max(1, Math.min(3, remain))), (COLS * CELL) / 2, (ROWS * CELL) / 2 + 20)
    }
  }, [collides, phase])

  const beginRound = useCallback((startAt, round, duo) => {
    duoRef.current = duo
    boardRef.current = emptyBoard()
    pieceRef.current = randomPiece(rt.identity, duo)
    nextRef.current = randomPiece(rt.identity, duo)
    scoreRef.current = 0
    linesRef.current = 0
    levelRef.current = 1
    dropTimerRef.current = 0
    lastTimeRef.current = 0
    fastDropRef.current = null
    fastTimerRef.current = 0
    finishedRef.current = false
    runningRef.current = true
    roundRef.current = round
    startAtRef.current = startAt
    seqRef.current = 0
    overlapRestartingRef.current = false
    setScore(0); setLines(0); setLevel(1); setReward(null)
    setPhase('running')
    publishBoard()
    publishMe(true)
  }, [rt.identity, publishBoard, publishMe])

  const startRound = useCallback(() => {
    const withPartner = together || (!solo && partnerOnline)
    const round = Math.max(Date.now(), (session && session.round) || 0, roundRef.current) + 1
    const startAt = Date.now() + COUNTDOWN
    beginRound(startAt, round, withPartner)
    if (withPartner) setTetrisSession(rt, { startAt, round, by: rt.identity, duo: true })
  }, [rt, session, partnerOnline, together, solo, beginRound])
  startRoundRef.current = startRound

  useEffect(() => {
    if (!together) return
    if (!session || session.round == null) return
    if (session.round <= roundRef.current) return
    beginRound(session.startAt, session.round, true)
  }, [together, session, beginRound])

  useGameLoop((time) => {
    const last = lastTimeRef.current || time
    const delta = time - last
    lastTimeRef.current = time

    if (duoRef.current) {
      const sharedBoard = boardWatchRef.current
      if (sharedBoard && sharedBoard.round === roundRef.current && (sharedBoard.seq || 0) > seqRef.current && sharedBoard.cells) {
        seqRef.current = sharedBoard.seq
        boardRef.current = unpackBoard(sharedBoard.cells)
        if (typeof sharedBoard.score === 'number') scoreRef.current = sharedBoard.score
        if (typeof sharedBoard.lines === 'number') linesRef.current = sharedBoard.lines
        if (typeof sharedBoard.level === 'number') levelRef.current = sharedBoard.level
        const piece = pieceRef.current
        if (piece && pieceOverlapsBoard(piece, boardRef.current)) restartFromOverlap()
      }
      const partnerLive = partnerRef.current
      if (runningRef.current && partnerLive && partnerLive.round === roundRef.current && partnerLive.alive === false) {
        runningRef.current = false
        setPhase('over')
      }
    }

    const started = startAtRef.current != null && Date.now() >= startAtRef.current

    if (runningRef.current && started && pieceRef.current) {
        if (fastDropRef.current != null) {
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
              if (hitsBoard(piece, boardRef.current, 0, 1)) lockPiece()
            }
          }
        } else {
          dropTimerRef.current += delta
          if (dropTimerRef.current > dropInterval()) {
            dropTimerRef.current = 0
            const piece = pieceRef.current
            if (!collides(piece, boardRef.current, 0, 1)) piece.y++
            else if (hitsBoard(piece, boardRef.current, 0, 1)) lockPiece()
          }
        }
        publishMe(false)
      }
      draw()
      drawNext()
  })

  useEffect(() => () => clearTetrisPlayer(rt), [rt])

  const move = useCallback((dx) => {
    if (fastDropRef.current != null || !runningRef.current || !pieceRef.current) return
    if (Date.now() < (startAtRef.current || 0)) return
    const piece = pieceRef.current
    if (!collides(piece, boardRef.current, dx, 0)) { piece.x += dx; publishMe(true) }
  }, [collides, publishMe])

  const softDrop = useCallback(() => {
    if (fastDropRef.current != null || !runningRef.current || !pieceRef.current) return
    if (Date.now() < (startAtRef.current || 0)) return
    const piece = pieceRef.current
    if (!collides(piece, boardRef.current, 0, 1)) {
      piece.y++
      scoreRef.current += 1
      setScore(scoreRef.current)
      dropTimerRef.current = 0
    } else if (hitsBoard(piece, boardRef.current, 0, 1)) lockPiece()
  }, [collides, hitsBoard, lockPiece])

  const hardDrop = useCallback(() => {
    if (fastDropRef.current != null || !runningRef.current || !pieceRef.current) return
    if (Date.now() < (startAtRef.current || 0)) return
    const piece = pieceRef.current
    let dist = 0
    while (!collides(piece, boardRef.current, 0, dist + 1)) dist++
    if (dist <= 0) {
      if (hitsBoard(piece, boardRef.current, 0, 1)) lockPiece()
      return
    }
    scoreRef.current += dist * 2
    setScore(scoreRef.current)
    fastDropRef.current = piece.y + dist
    fastTimerRef.current = 0
  }, [collides, hitsBoard, lockPiece])

  const rotate = useCallback(() => {
    if (fastDropRef.current != null || !runningRef.current || !pieceRef.current) return
    if (Date.now() < (startAtRef.current || 0)) return
    const piece = pieceRef.current
    if (piece.type === 'O') return
    const rotated = normalize(rotateCells(piece.cells))
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!collides(piece, boardRef.current, dx, 0, rotated)) {
        piece.cells = rotated
        piece.x += dx
        publishMe(true)
        return
      }
    }
  }, [collides, publishMe])

  useEffect(() => {
    const handler = (e) => {
      if (isTypingInField(e)) return
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

  const [partnerScore, setPartnerScore] = useState(null)
  useEffect(() => {
    const id = setInterval(() => {
      const ps = partnerRef.current
      setPartnerScore(ps && ps.round === roundRef.current ? (ps.score ?? 0) : null)
      setScore(scoreRef.current)
      setLines(linesRef.current)
      setLevel(levelRef.current)
    }, 140)
    return () => clearInterval(id)
  }, [partnerRef])

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">tetris{together || (!solo && partnerOnline) ? ' · 2P' : ''}</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      {(together || (!solo && partnerOnline)) && phase !== 'idle' && (
        <div className="flappy-scorebar">
          <span className="fs-me">you <b>{score}</b></span>
          <span className="fs-vs">one well</span>
          <span className="fs-them">
            {partner} <b>{partnerScore == null ? (partnerOnline ? '—' : 'away') : partnerScore}</b>
          </span>
        </div>
      )}

      <div className="tetris-layout" style={{ position: 'relative' }}>
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

        {ask && (
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,15,0.78)' }}>
            <PlayInvite game="tetris" partner={partner} onTogether={playTogether} onSolo={playSolo} />
          </div>
        )}
        {phase === 'idle' && !ask && (
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,15,0.72)' }}>
            <div className="game-over-card">
              <div className="go-title">tetris</div>
              <div className="go-msg">
                {solo || !partnerOnline
                  ? 'play your own well.'
                  : `one well, two pieces — pass through ${partner}'s falling block. if you both lock on the same cells, the game restarts.`}
              </div>
              <button className="btn btn-cyan mt-16" onClick={startRound}>start</button>
            </div>
          </div>
        )}
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

      {phase === 'over' && reward && (
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
              <button className="btn btn-cyan" onClick={startRound}>play again</button>
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
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x + 1, y + 1, size - 2, 3)
  ctx.fillRect(x + 1, y + 1, 3, size - 2)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x + 1, y + size - 4, size - 2, 3)
  ctx.fillRect(x + size - 4, y + 1, 3, size - 2)
}

let gridLayer = null
function tetrisGridLayer() {
  if (gridLayer) return gridLayer
  gridLayer = makeLayer(COLS * CELL, ROWS * CELL, (ctx) => {
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.strokeStyle = 'rgba(160,107,255,0.08)'
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke()
    }
  })
  return gridLayer
}

let boardLayer = null
let boardSig = -1
function tetrisBoardLayer(board, seq) {
  if (boardLayer && boardSig === seq) return boardLayer
  boardSig = seq
  boardLayer = makeLayer(COLS * CELL, ROWS * CELL, (ctx) => {
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.globalAlpha = 0.42
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c])
      }
    }
  })
  return boardLayer
}
