import { useCallback, useEffect, useRef, useState } from 'react'
import { flappyReward } from '../utils/rewards'
import { useRealtime, useWatch, usePartnerOnline } from '../realtime/RealtimeContext'
import { usePlayTogether } from '../hooks/usePlayTogether'
import PlayInvite from '../components/PlayInvite'
import { setFlappySession, setFlappyBird, clearFlappyBird } from '../realtime/world'
import { getAnimal } from '../utils/animals'
import { isTypingInField } from '../utils/keys'
import './games.css'

// ---- world constants (shared by both players so the pipes line up) ----
const WIDTH = 340
const HEIGHT = 460
const GROUND = 54
const BIRD_X = 96
const BIRD_R = 13
const GRAVITY = 0.42
const FLAP = -7
const SPEED = 2.3            // px the world scrolls per 60fps step
const PIPE_W = 56
const GAP = 155
const SPACING = 200         // px between pipe centers
const FIRST_X = WIDTH + 60
const MARGIN = 54
const STEP_MS = 1000 / 60
const COUNTDOWN = 1600

const TOP_LIMIT = MARGIN + GAP / 2
const RANGE = (HEIGHT - GROUND - MARGIN - GAP / 2) - TOP_LIMIT

// deterministic gap center for pipe i, derived from the shared seed. both
// players compute the exact same pipes without streaming them frame by frame.
function gapCenter(seed, i) {
  let t = (seed + i * 1013904223) >>> 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return TOP_LIMIT + r * RANGE
}

export default function FlappyBird({ onExit, onFinish, highScore, mySpecies }) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const { ask, together, solo, playTogether, playSolo } = usePlayTogether('flappy')
  const session = useWatch('games/flappy/session')
  const partnerBird = useWatch(`games/flappy/birds/${partner}`)

  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const birdRef = useRef({ y: HEIGHT * 0.42, vy: 0 })
  const frameRef = useRef(0)
  const startAtRef = useRef(null)
  const seedRef = useRef(0)
  const roundRef = useRef(0)
  const aliveRef = useRef(false)
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const lastPubRef = useRef(0)
  const partnerYRef = useRef(HEIGHT * 0.42)
  const partnerBirdRef = useRef(null)
  partnerBirdRef.current = partnerBird
  const partnerOnlineRef = useRef(partnerOnline)
  partnerOnlineRef.current = partnerOnline
  const startRoundRef = useRef(() => {})
  const pendingRestartRef = useRef(false)
  const duoRef = useRef(false)

  const [phase, setPhase] = useState('idle') // idle | running | dead | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(highScore || 0)
  const [reward, setReward] = useState(null)

  const myColor = (getAnimal(mySpecies)?.body) || '#ffd84b'
  const partnerColor = '#4be0e0'

  const publish = useCallback((force) => {
    if (!duoRef.current) return
    const now = Date.now()
    if (!force && now - lastPubRef.current < 80) return
    lastPubRef.current = now
    setFlappyBird(rt, {
      y: Math.round(birdRef.current.y),
      alive: aliveRef.current,
      score: scoreRef.current,
      round: roundRef.current,
    })
  }, [rt])

  const finishRound = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const s = scoreRef.current
    const isHigh = s > (highScore || 0)
    setBest((b) => Math.max(b, s))
    const r = flappyReward(s)
    setReward({ ...r, isHigh })
    setPhase('over')
    onFinish(r, s, isHigh)
  }, [highScore, onFinish])

  const die = useCallback(() => {
    if (!aliveRef.current) return
    aliveRef.current = false
    publish(true)
    setBest((b) => Math.max(b, scoreRef.current))
    const pb = partnerBirdRef.current
    const partnerInRound = duoRef.current && Boolean(pb && pb.round === roundRef.current && partnerOnlineRef.current)
    if (partnerInRound) {
      pendingRestartRef.current = true
    } else {
      setPhase('dead')
    }
  }, [publish])

  const beginRound = useCallback((seed, startAt, round, withPartner = false) => {
    duoRef.current = withPartner
    seedRef.current = seed
    startAtRef.current = startAt
    roundRef.current = round
    frameRef.current = 0
    birdRef.current = { y: HEIGHT * 0.42, vy: 0 }
    aliveRef.current = true
    scoreRef.current = 0
    finishedRef.current = false
    setScore(0)
    setReward(null)
    setPhase('running')
    publish(true)
  }, [publish])

  const startRound = useCallback(() => {
    const withPartner = together || (!solo && partnerOnline)
    const round = Math.max(Date.now(), (session && session.round) || 0, roundRef.current) + 1
    const seed = (Math.floor(Math.random() * 0xffffffff)) >>> 0
    const startAt = Date.now() + COUNTDOWN
    pendingRestartRef.current = false
    beginRound(seed, startAt, round, withPartner)
    if (withPartner) setFlappySession(rt, { seed, startAt, round, by: rt.identity })
  }, [rt, session, beginRound, together, solo, partnerOnline])
  startRoundRef.current = startRound

  useEffect(() => {
    if (!together) return
    if (!session || session.round == null) return
    if (session.round <= roundRef.current) return
    const partnerInRound = partnerBird && partnerBird.round === session.round
    if (!partnerInRound && session.startAt && Date.now() > session.startAt + 8000) return
    beginRound(session.seed, session.startAt, session.round, true)
  }, [together, session, beginRound, partnerBird])

  // resolve the round once I'm dead and my partner is done (or not in this round).
  useEffect(() => {
    if (phase !== 'dead') return
    const pb = partnerBird
    const partnerDone = !pb || pb.round !== roundRef.current || pb.alive === false || !partnerOnline
    if (partnerDone) finishRound()
  }, [phase, partnerBird, partnerOnline, finishRound])

  const flap = useCallback(() => {
    if (phase !== 'running' || !aliveRef.current) return
    if (Date.now() < (startAtRef.current || 0)) return
    birdRef.current.vy = FLAP
  }, [phase])

  // input
  useEffect(() => {
    const key = (e) => {
      if (isTypingInField(e)) return
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        flap()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [flap])

  const step = useCallback(() => {
    const bird = birdRef.current
    bird.vy += GRAVITY
    bird.y += bird.vy
    const d = frameRef.current * SPEED

    // ground / ceiling
    if (bird.y + BIRD_R > HEIGHT - GROUND) { bird.y = HEIGHT - GROUND - BIRD_R; die(); return }
    if (bird.y - BIRD_R < 0) { bird.y = BIRD_R; die(); return }

    // pipe collision — only check the couple of pipes near the bird.
    const iNear = Math.floor((d + BIRD_X - FIRST_X) / SPACING)
    for (let i = iNear - 1; i <= iNear + 1; i++) {
      if (i < 0) continue
      const cx = FIRST_X + i * SPACING - d
      if (BIRD_X + BIRD_R < cx - PIPE_W / 2 || BIRD_X - BIRD_R > cx + PIPE_W / 2) continue
      const gy = gapCenter(seedRef.current, i)
      if (bird.y - BIRD_R < gy - GAP / 2 || bird.y + BIRD_R > gy + GAP / 2) { die(); return }
    }

    // score = pipes fully passed
    const passed = Math.max(0, Math.floor((d + BIRD_X - PIPE_W / 2 - FIRST_X) / SPACING) + 1)
    if (passed > scoreRef.current) { scoreRef.current = passed; setScore(passed) }
  }, [die])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    grad.addColorStop(0, '#1a1140')
    grad.addColorStop(1, '#2a1a52')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    const running = startAtRef.current != null && Date.now() >= startAtRef.current
    const d = running || phase === 'over' || phase === 'dead' ? frameRef.current * SPEED : 0

    // pipes
    const iFrom = Math.max(0, Math.floor((d - FIRST_X - PIPE_W) / SPACING))
    const iTo = Math.floor((d + WIDTH - FIRST_X) / SPACING) + 1
    for (let i = iFrom; i <= iTo; i++) {
      if (i < 0) continue
      const cx = FIRST_X + i * SPACING - d
      if (cx + PIPE_W / 2 < 0 || cx - PIPE_W / 2 > WIDTH) continue
      const gy = gapCenter(seedRef.current, i)
      drawPipe(ctx, cx - PIPE_W / 2, 0, PIPE_W, gy - GAP / 2, true)
      drawPipe(ctx, cx - PIPE_W / 2, gy + GAP / 2, PIPE_W, HEIGHT - GROUND - (gy + GAP / 2), false)
    }

    // ground
    ctx.fillStyle = '#3a2c1a'
    ctx.fillRect(0, HEIGHT - GROUND, WIDTH, GROUND)
    ctx.fillStyle = '#6be675'
    ctx.fillRect(0, HEIGHT - GROUND, WIDTH, 8)

    // partner bird (ghost) — smoothed toward the latest reported y
    const pb = partnerBirdRef.current
    if (duoRef.current && pb && pb.round === roundRef.current && partnerOnlineRef.current) {
      partnerYRef.current += ((pb.y ?? partnerYRef.current) - partnerYRef.current) * 0.3
      drawBird(ctx, BIRD_X - 20, partnerYRef.current, partnerColor, pb.alive === false, true)
    }

    // my bird
    drawBird(ctx, BIRD_X, birdRef.current.y, myColor, !aliveRef.current, false)

    // countdown
    if (startAtRef.current != null && Date.now() < startAtRef.current && phase === 'running') {
      const remain = Math.ceil((startAtRef.current - Date.now()) / (COUNTDOWN / 3))
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 64px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(String(Math.max(1, Math.min(3, remain))), WIDTH / 2, HEIGHT / 2 + 20)
    }
  }, [phase, myColor])

  // main loop
  useEffect(() => {
    const loop = () => {
      const now = Date.now()
      const startAt = startAtRef.current
      if (phase === 'running' && aliveRef.current && startAt != null && now >= startAt) {
        const targetFrame = Math.floor((now - startAt) / STEP_MS)
        let guard = 0
        while (frameRef.current < targetFrame && aliveRef.current && guard < 240) {
          frameRef.current++
          guard++
          step()
        }
        publish(false)
      }
      if (pendingRestartRef.current) {
        pendingRestartRef.current = false
        startRoundRef.current()
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, step, draw, publish])

  // cleanup my published bird when leaving
  useEffect(() => () => clearFlappyBird(rt), [rt])

  const partnerScore = (partnerBird && partnerBird.round === roundRef.current) ? (partnerBird.score ?? 0) : null

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">flappy{together || (!solo && partnerOnline) ? ' · 2P' : ''}</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      {(together || (!solo && partnerOnline)) && (
      <div className="flappy-scorebar">
        <span className="fs-me">you <b>{score}</b></span>
        <span className="fs-vs">vs</span>
        <span className="fs-them">
          {partner} <b>{partnerScore == null ? (partnerOnline ? '—' : 'away') : partnerScore}</b>
        </span>
      </div>
      )}

      <div className="flappy-stage" style={{ position: 'relative' }} onPointerDown={flap}>
        <canvas ref={canvasRef} className="canvas-stage" width={WIDTH} height={HEIGHT} />

        {ask && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.78)' }}>
            <PlayInvite game="flappy" partner={partner} onTogether={playTogether} onSolo={playSolo} />
          </div>
        )}
        {(phase === 'idle') && !ask && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.72)' }}>
            <div className="game-over-card">
              <div className="go-title">flappy</div>
              <div className="go-msg">
                tap / space to flap through the pipes.<br />
                {solo || !partnerOnline
                  ? 'play solo.'
                  : `${partner} is online — same sky. if one of you falls, you both restart.`}
              </div>
              <button className="btn btn-yellow mt-16" onClick={startRound}>start</button>
            </div>
          </div>
        )}

        {phase === 'dead' && (
          <div className="overlay" style={{ position: 'absolute', background: 'rgba(4,1,15,0.5)' }}>
            <div className="game-over-card">
              <div className="go-title">down!</div>
              <div className="go-msg">waiting for {partner} to finish…</div>
            </div>
          </div>
        )}
      </div>

      <p className="hint center">tap the screen or press space to flap</p>

      {phase === 'over' && reward && (
        <div className="overlay">
          <div className="game-over-card">
            <div className="go-title">{reward.isHigh ? 'new high score' : 'round over'}</div>
            <div className="go-msg">
              you scored <b style={{ color: 'var(--yellow)' }}>{score}</b>
              {partnerScore != null && <> · {partner} scored <b style={{ color: 'var(--cyan)' }}>{partnerScore}</b></>}
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
              <button className="btn btn-yellow" onClick={startRound}>play again</button>
              <button className="btn btn-purple" onClick={onExit}>back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function drawPipe(ctx, x, y, w, h, isTop) {
  if (h <= 0) return
  ctx.fillStyle = '#5fbf5f'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(x + 3, y, 4, h)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x + w - 6, y, 4, h)
  // lip
  ctx.fillStyle = '#4aa14a'
  const lipH = 14
  const lipY = isTop ? y + h - lipH : y
  ctx.fillRect(x - 3, lipY, w + 6, lipH)
}

function drawBird(ctx, x, y, color, dead, ghost) {
  ctx.save()
  if (ghost) ctx.globalAlpha = 0.55
  // body
  ctx.fillStyle = color
  ctx.fillRect(x - BIRD_R, y - BIRD_R, BIRD_R * 2, BIRD_R * 2)
  // belly
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(x - BIRD_R, y + 2, BIRD_R * 2, BIRD_R - 2)
  // wing
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fillRect(x - BIRD_R + 3, y - 2, 10, 6)
  // eye
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 3, y - 8, 7, 7)
  ctx.fillStyle = dead ? '#ff5f6d' : '#241a3d'
  ctx.fillRect(x + 6, y - 6, 3, 3)
  // beak
  ctx.fillStyle = '#ff9f43'
  ctx.fillRect(x + BIRD_R - 2, y - 1, 6, 5)
  ctx.restore()
}
