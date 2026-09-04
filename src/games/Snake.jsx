import { useCallback, useEffect, useRef, useState } from 'react'
import { snakeReward } from '../utils/rewards'
import { useRealtime, useWatch, useWatchRef, usePartnerOnline } from '../realtime/RealtimeContext'
import { usePlayTogether } from '../hooks/usePlayTogether'
import { useGameLoop } from '../hooks/useGameLoop'
import { get2d, makeLayer } from '../utils/canvas'
import PlayInvite from '../components/PlayInvite'
import { setSnakeSession, setSnakePlayer, clearSnakePlayer } from '../realtime/world'
import { isTypingInField } from '../utils/keys'
import './games.css'

// ---- arena (bigger than before) ----
const GRID = 24
const CELL = 24
const SIZE = GRID * CELL
const COUNTDOWN = 1600

// tick interval in ms — starts quick and speeds up a touch as you grow.
const START_MS = 118
const MIN_MS = 62
const DEC_MS = 3
const speedFor = (score) => Math.max(MIN_MS, START_MS - score * DEC_MS)

const lerp = (a, b, t) => a + (b - a) * t

function randCell(occupied) {
  while (true) {
    const p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
    if (!occupied.some((s) => s.x === p.x && s.y === p.y)) return p
  }
}

// spawn the two players apart (and on different rows) so they never start on
// top of each other. each client uses its own identity to place its snake.
function startFor(identity) {
  if (identity === 'ali') return { body: [{ x: GRID - 5, y: GRID - 8 }], dir: { x: -1, y: 0 } }
  return { body: [{ x: 4, y: 7 }], dir: { x: 1, y: 0 } }
}

function snakeCells(body) {
  if (!body) return []
  const list = Array.isArray(body) ? body : Object.values(body)
  return list.filter((c) => c && Number.isFinite(c.x) && Number.isFinite(c.y))
}

export default function Snake({ onExit, onFinish, highScore }) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const { ask, together, solo, playTogether, playSolo } = usePlayTogether('snake')
  const session = useWatch('games/snake/session')
  const partnerRef = useWatchRef(`games/snake/players/${partner}`)

  const canvasRef = useRef(null)
  const partnerDrawRef = useRef([])

  const snakeRef = useRef([])
  const prevBodyRef = useRef([])
  const dirRef = useRef({ x: 1, y: 0 })
  const nextDirRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 0, y: 0 })
  const scoreRef = useRef(0)
  const aliveRef = useRef(false)
  const roundRef = useRef(0)
  const finishedRef = useRef(false)
  const startAtRef = useRef(null)
  const accRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastPubRef = useRef(0)
  const crashRef = useRef(null)
  const duoRef = useRef(false)

  const partnerOnlineRef = useRef(partnerOnline)
  partnerOnlineRef.current = partnerOnline

  const [phase, setPhase] = useState('idle') // idle | running | dead | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(highScore || 0)
  const [reward, setReward] = useState(null)

  const publish = useCallback((force) => {
    if (!duoRef.current) return
    const now = Date.now()
    if (!force && now - lastPubRef.current < 45) return
    lastPubRef.current = now
    setSnakePlayer(rt, {
      body: snakeRef.current,
      food: foodRef.current,
      dir: dirRef.current,
      score: scoreRef.current,
      alive: aliveRef.current,
      round: roundRef.current,
      crash: crashRef.current,
    })
  }, [rt])

  const finishRound = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const s = scoreRef.current
    const isHigh = s > (highScore || 0)
    setBest((b) => Math.max(b, s))
    const r = snakeReward(s)
    setScore(s)
    setReward({ ...r, isHigh })
    setPhase('over')
    onFinish(r, s, isHigh)
  }, [highScore, onFinish])

  const die = useCallback((fromTouch = false) => {
    if (!aliveRef.current) return
    aliveRef.current = false
    if (fromTouch) crashRef.current = roundRef.current
    publish(true)
    setPhase('dead')
  }, [publish])

  const beginRound = useCallback((startAt, round, withPartner = false) => {
    duoRef.current = withPartner
    const s = startFor(rt.identity)
    snakeRef.current = s.body.map((p) => ({ ...p }))
    prevBodyRef.current = snakeRef.current.map((p) => ({ ...p }))
    dirRef.current = { ...s.dir }
    nextDirRef.current = { ...s.dir }
    foodRef.current = randCell(snakeRef.current)
    scoreRef.current = 0
    aliveRef.current = true
    finishedRef.current = false
    roundRef.current = round
    startAtRef.current = startAt
    accRef.current = 0
    lastTimeRef.current = 0
    crashRef.current = null
    partnerDrawRef.current = []
    setScore(0)
    setReward(null)
    setPhase('running')
    publish(true)
  }, [rt, publish])

  // start (or restart) a shared round — both players begin together.
  const startRound = useCallback(() => {
    const withPartner = together || (!solo && partnerOnline)
    const round = Math.max(Date.now(), (session && session.round) || 0, roundRef.current) + 1
    const startAt = Date.now() + COUNTDOWN
    beginRound(startAt, round, withPartner)
    if (withPartner) setSnakeSession(rt, { startAt, round, by: rt.identity })
  }, [rt, session, beginRound, together, solo, partnerOnline])

  useEffect(() => {
    if (!together) return
    if (!session || session.round == null) return
    if (session.round <= roundRef.current) return
    beginRound(session.startAt, session.round, true)
  }, [together, session, beginRound])

  const setDir = useCallback((x, y) => {
    // never reverse straight back onto yourself.
    if (dirRef.current.x === -x && dirRef.current.y === -y) return
    nextDirRef.current = { x, y }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (isTypingInField(e)) return
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

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current
    const snake = snakeRef.current
    const head = snake[0]
    if (!head) return
    const dir = dirRef.current
    if (!dir.x && !dir.y) return
    const nx = head.x + dir.x
    const ny = head.y + dir.y

    // wall
    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) { die(); return }
    // self
    if (snake.some((s) => s.x === nx && s.y === ny)) { die(); return }
    // either snake touching the other — both die.
    const ps = partnerRef.current
    const pBody = snakeCells(ps && ps.body)
    const partnerLive = duoRef.current && ps && ps.round === roundRef.current && partnerOnlineRef.current
      && ps.alive !== false && pBody.length > 0
      && Date.now() >= (startAtRef.current || 0)
    if (partnerLive && pBody.some((s) => s.x === nx && s.y === ny)) { die(true); return }

    prevBodyRef.current = snake.map((p) => ({ ...p }))
    snake.unshift({ x: nx, y: ny })

    if (nx === foodRef.current.x && ny === foodRef.current.y) {
      scoreRef.current += 1
      foodRef.current = randCell(snake)
    } else {
      snake.pop()
    }
  }, [die])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = get2d(canvas)
    ctx.drawImage(snakeGridLayer(), 0, 0)

    const interval = speedFor(scoreRef.current)
    const running = phase === 'running' && aliveRef.current
      && startAtRef.current != null && Date.now() >= startAtRef.current
    const t = running ? Math.min(accRef.current / interval, 1) : 1

    // my food
    drawFood(ctx, foodRef.current, '#ff5f6d')

    // partner (food + snake) — only while they're live in this same round.
    const ps = partnerRef.current
    const showP = duoRef.current && ps && ps.round === roundRef.current && partnerOnlineRef.current
    if (showP) {
      if (ps.food) drawFood(ctx, ps.food, 'rgba(255,159,67,0.55)')
      const pBody = snakeCells(ps.body)
      if (pBody.length) {
        const smooth = smoothSnake(pBody, partnerDrawRef)
        drawSnake(ctx, smooth, smooth, 1, ps.dir, '#4be0e0', '#2f9ea0', ps.alive === false)
      }
    }

    // my snake — interpolated between ticks so it glides instead of hopping.
    drawSnake(ctx, snakeRef.current, prevBodyRef.current, t, dirRef.current, '#6be675', '#3f9f52', !aliveRef.current)

    // countdown
    if (startAtRef.current != null && Date.now() < startAtRef.current && phase === 'running') {
      const remain = Math.ceil((startAtRef.current - Date.now()) / (COUNTDOWN / 3))
      ctx.fillStyle = 'rgba(0,0,0,0.42)'
      ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 72px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(String(Math.max(1, Math.min(3, remain))), SIZE / 2, SIZE / 2 + 24)
    }
  }, [phase])

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useGameLoop((time) => {
    const last = lastTimeRef.current || time
    const delta = time - last
    lastTimeRef.current = time
    const ps = partnerRef.current

    if (phaseRef.current === 'running' && aliveRef.current && Date.now() >= (startAtRef.current || 0)) {
      if (ps && duoRef.current && ps.round === roundRef.current && ps.alive === false && ps.crash === roundRef.current) die()
      const interval = speedFor(scoreRef.current)
      accRef.current += delta
      let guard = 0
      while (accRef.current >= interval && aliveRef.current && guard < 4) {
        accRef.current -= interval
        guard++
        tick()
      }
      publish(false)
    }
    if (phaseRef.current === 'dead') {
      const partnerDone = !duoRef.current || !ps || ps.round !== roundRef.current || ps.alive === false || !partnerOnlineRef.current
      if (partnerDone) finishRound()
    }
    draw()
  })

  // clean up my published snake when leaving.
  useEffect(() => () => clearSnakePlayer(rt), [rt])

  const [partnerScore, setPartnerScore] = useState(null)
  const [themDead, setThemDead] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      const ps = partnerRef.current
      const same = ps && ps.round === roundRef.current
      setPartnerScore(same ? (ps.score ?? 0) : null)
      setThemDead(Boolean(same && ps.alive === false))
      setScore(scoreRef.current)
    }, 140)
    return () => clearInterval(id)
  }, [partnerRef])

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">snake{together || (!solo && partnerOnline) ? ' · 2P' : ''}</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      {(together || (!solo && partnerOnline)) && (
        <div className="flappy-scorebar" style={{ width: 'min(576px, 92vw)' }}>
          <span className="fs-me">you <b>{score}</b></span>
          <span className="fs-vs">vs</span>
          <span className="fs-them">
            {partner} <b>{partnerScore == null ? (partnerOnline ? '—' : 'away') : partnerScore}</b>
          </span>
        </div>
      )}

      <div className="snake-frame" style={{ position: 'relative', width: 'min(576px, 92vw)' }}>
        <canvas ref={canvasRef} className="canvas-stage" width={SIZE} height={SIZE} />

        {ask && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.78)' }}>
            <PlayInvite game="snake" partner={partner} onTogether={playTogether} onSolo={playSolo} />
          </div>
        )}
        {phase === 'idle' && !ask && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.75)' }}>
            <div className="game-over-card">
              <div className="go-title">snake</div>
              <div className="go-msg">
                eat apples to grow.<br />
                {solo || !partnerOnline
                  ? 'play solo.'
                  : `${partner} is online — one arena. if you touch, you both die.`}
              </div>
              <button className="btn btn-green mt-16" onClick={startRound}>start</button>
            </div>
          </div>
        )}

        {phase === 'dead' && (together || (!solo && partnerOnline)) && !themDead && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.5)' }}>
            <div className="game-over-card">
              <div className="go-title">crashed!</div>
              <div className="go-msg">waiting for {partner} to finish…</div>
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

      {phase === 'over' && reward && (
        <div className="overlay">
          <div className="game-over-card">
            <div className="go-title">{reward.isHigh ? 'new high score' : 'good game'}</div>
            <div className="go-msg">
              you reached <b style={{ color: 'var(--green-2)' }}>{score}</b>
              {partnerScore != null && <> · {partner} reached <b style={{ color: 'var(--cyan)' }}>{partnerScore}</b></>}
              <br />
              {partnerScore == null ? reward.message
                : score > partnerScore ? 'you win!'
                  : score < partnerScore ? `${partner} wins this round` : 'a tie!'}
            </div>
            <div className="reward-list">
              <span className="chip chip-xp">+{reward.xp} xp</span>
              <span className="chip chip-coins">+{reward.coins} coins</span>
              <span className="chip" style={{ color: 'var(--yellow)' }}>+{reward.hunger} food</span>
              <span className="chip" style={{ color: 'var(--pink)' }}>+{reward.happiness} happy</span>
            </div>
            <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button className="btn btn-green" onClick={startRound}>play again</button>
              <button className="btn btn-purple" onClick={onExit}>back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

let gridLayer = null
function snakeGridLayer() {
  if (gridLayer) return gridLayer
  gridLayer = makeLayer(SIZE, SIZE, (ctx) => {
    ctx.fillStyle = '#07021a'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = 'rgba(160,107,255,0.06)'
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke()
    }
  })
  return gridLayer
}

function smoothSnake(body, drawRef) {
  const drawn = drawRef.current
  if (!drawn.length || drawn.length !== body.length) {
    drawRef.current = body.map((p) => ({ x: p.x, y: p.y }))
    return drawRef.current
  }
  for (let i = 0; i < body.length; i++) {
    drawn[i].x += (body[i].x - drawn[i].x) * 0.42
    drawn[i].y += (body[i].y - drawn[i].y) * 0.42
  }
  return drawn
}

function drawFood(ctx, f, color) {
  if (!f) return
  ctx.fillStyle = color
  ctx.fillRect(f.x * CELL + 4, f.y * CELL + 5, CELL - 8, CELL - 8)
  ctx.fillStyle = '#6be675'
  ctx.fillRect(f.x * CELL + CELL / 2 - 1, f.y * CELL + 2, 3, 4)
}

function drawSnake(ctx, body, prev, t, dir, headColor, bodyColor, dead) {
  if (!Array.isArray(body)) return
  for (let i = body.length - 1; i >= 0; i -= 1) {
    const to = body[i]
    const from = (prev && prev[i]) || to
    const x = lerp(from.x, to.x, t) * CELL
    const y = lerp(from.y, to.y, t) * CELL
    const head = i === 0
    ctx.fillStyle = dead ? '#7a3b46' : (head ? headColor : bodyColor)
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(x + 1, y + 1, CELL - 2, 3)
    if (head) {
      ctx.fillStyle = dead ? '#ff5f6d' : '#241a3d'
      const ex = (dir && dir.x) || 0
      const ey = (dir && dir.y) || 0
      ctx.fillRect(x + 6 + ex * 4, y + 6 + ey * 2, 3, 3)
      ctx.fillRect(x + CELL - 9 + ex * 4, y + 6 + ey * 2, 3, 3)
    }
  }
}
