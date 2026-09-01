import { useCallback, useEffect, useRef, useState } from 'react'
import { snakeReward } from '../utils/rewards'
import './games.css'

const GRID = 17
const CELL = 22
const SIZE = GRID * CELL

function randCell(exclude) {
  while (true) {
    const p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
    if (!exclude.some((s) => s.x === p.x && s.y === p.y)) return p
  }
}

export default function Snake({ onExit, onFinish, highScore, onScore }) {
  const canvasRef = useRef(null)
  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore
  const reportScore = (v) => onScoreRef.current && onScoreRef.current(v)

  const snakeRef = useRef([{ x: 8, y: 8 }])
  const dirRef = useRef({ x: 1, y: 0 })
  const nextDirRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 12, y: 8 })
  const runningRef = useRef(false)
  const finishedRef = useRef(false)
  const accRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)

  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [reward, setReward] = useState(null)
  const [best, setBest] = useState(highScore || 0)
  const scoreRef = useRef(0)

  const speed = () => Math.max(70, 190 - scoreRef.current * 6)

  const endGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    runningRef.current = false
    const isHigh = scoreRef.current > (highScore || 0)
    setBest(Math.max(highScore || 0, scoreRef.current))
    const r = snakeReward(scoreRef.current)
    setReward({ ...r, isHigh })
    setGameOver(true)
    onFinish(r, scoreRef.current, isHigh)
  }, [highScore, onFinish])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, SIZE, SIZE)

    // subtle grid
    ctx.strokeStyle = 'rgba(160,107,255,0.07)'
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke()
    }

    // food (little apple)
    const f = foodRef.current
    ctx.fillStyle = '#ff5f6d'
    ctx.fillRect(f.x * CELL + 4, f.y * CELL + 5, CELL - 8, CELL - 8)
    ctx.fillStyle = '#6be675'
    ctx.fillRect(f.x * CELL + CELL / 2 - 1, f.y * CELL + 2, 3, 4)

    // snake
    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      const head = i === 0
      ctx.fillStyle = head ? '#8fe3d0' : '#5fbfae'
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, 3)
      if (head) {
        ctx.fillStyle = '#241a3d'
        const ex = dirRef.current.x
        const ey = dirRef.current.y
        // eyes based on direction
        const cx = seg.x * CELL
        const cy = seg.y * CELL
        ctx.fillRect(cx + 6 + ex * 4, cy + 6 + ey * 2, 3, 3)
        ctx.fillRect(cx + CELL - 9 + ex * 4, cy + 6 + ey * 2, 3, 3)
      }
    })
  }, [])

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current
    const snake = snakeRef.current
    const head = snake[0]
    const nx = head.x + dirRef.current.x
    const ny = head.y + dirRef.current.y

    // wall collision
    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) { endGame(); return }
    // self collision
    if (snake.some((s) => s.x === nx && s.y === ny)) { endGame(); return }

    const newHead = { x: nx, y: ny }
    snake.unshift(newHead)

    if (nx === foodRef.current.x && ny === foodRef.current.y) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      reportScore(scoreRef.current)
      foodRef.current = randCell(snake)
    } else {
      snake.pop()
    }
  }, [endGame])

  useEffect(() => {
    const step = (time) => {
      const last = lastTimeRef.current || time
      const delta = time - last
      lastTimeRef.current = time
      if (runningRef.current) {
        accRef.current += delta
        if (accRef.current >= speed()) {
          accRef.current = 0
          tick()
        }
      }
      draw()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, draw])

  const setDir = useCallback((x, y) => {
    // prevent 180-degree reversal.
    if (dirRef.current.x === -x && dirRef.current.y === -y) return
    nextDirRef.current = { x, y }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': e.preventDefault(); setDir(0, -1); break
        case 'ArrowDown': case 's': e.preventDefault(); setDir(0, 1); break
        case 'ArrowLeft': case 'a': e.preventDefault(); setDir(-1, 0); break
        case 'ArrowRight': case 'd': e.preventDefault(); setDir(1, 0); break
        default: break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setDir])

  const start = () => {
    snakeRef.current = [{ x: 8, y: 8 }]
    dirRef.current = { x: 1, y: 0 }
    nextDirRef.current = { x: 1, y: 0 }
    foodRef.current = randCell(snakeRef.current)
    scoreRef.current = 0
    accRef.current = 0
    finishedRef.current = false
    runningRef.current = true
    setScore(0); setStarted(true); setGameOver(false); setReward(null)
    reportScore(0)
  }

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">snake</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      <div className="score-line"><span>score <b style={{ color: 'var(--green-2)' }}>{score}</b></span></div>

      <div className="snake-frame" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="canvas-stage" width={SIZE} height={SIZE} />
        {!started && !gameOver && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.75)' }}>
            <div className="game-over-card">
              <div className="go-title">snake</div>
              <div className="go-msg">grow as long as you can and earn food for your pet.</div>
              <button className="btn btn-green mt-16" onClick={start}>start</button>
            </div>
          </div>
        )}
      </div>

      <div className="mobile-controls">
        <div className="dpad">
          <button style={{ gridColumn: 2 }} onClick={() => setDir(0, -1)}>↑</button>
          <button onClick={() => setDir(-1, 0)}>←</button>
          <button onClick={() => setDir(0, 1)}>↓</button>
          <button onClick={() => setDir(1, 0)}>→</button>
        </div>
      </div>

      <p className="hint center">arrow keys or wasd to move</p>

      {gameOver && reward && (
        <div className="overlay">
          <div className="game-over-card">
            <div className="go-title">{reward.isHigh ? 'new high score' : 'good game'}</div>
            <div className="go-msg">{reward.message}<br />you reached <b style={{ color: 'var(--green-2)' }}>{score}</b></div>
            <div className="reward-list">
              <span className="chip chip-xp">+{reward.xp} xp</span>
              <span className="chip chip-coins">+{reward.coins} coins</span>
              <span className="chip" style={{ color: 'var(--yellow)' }}>+{reward.hunger} food</span>
              <span className="chip" style={{ color: 'var(--pink)' }}>+{reward.happiness} happy</span>
            </div>
            <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button className="btn btn-green" onClick={start}>play again</button>
              <button className="btn btn-purple" onClick={onExit}>back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
