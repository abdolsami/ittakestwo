import { useCallback, useEffect, useRef, useState } from 'react'
import Pet from './Pet'
import GiftMenu from './GiftMenu'
import { FriendshipStars } from './Friendship'
import { useRealtime, useWatch } from '../realtime/RealtimeContext'
import { setParkState, emitEvent, addFriendship } from '../realtime/world'
import { useNewEvents } from '../hooks/useWorldEvents'
import { moodFromSnapshot } from '../utils/petText'
import { friendshipLevel, UNLOCKS, randomMeet, giftById } from '../utils/social'
import { isTypingInField } from '../utils/keys'

// play-area bounds in percent of the park.
const BOUNDS = { minX: 8, maxX: 92, minY: 48, maxY: 86 }
const SPEED = 0.85 // percent per frame
const MEET_DIST = 20 // proximity radius for interactions
const PUBLISH_MS = 90

const clampX = (x) => Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, x))
const clampY = (y) => Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, y))
const startPos = (identity) => (
  identity === 'mehreenz'
    ? { x: 28, y: 72, dir: 'right', pose: 'idle' }
    : { x: 72, y: 72, dir: 'left', pose: 'idle' }
)

export default function PetPark({
  identity, partner, myPet, partnerPet, friendship, partnerOnline, notify,
}) {
  const rt = useRealtime()
  const partnerPark = useWatch(`park/${partner}`)

  const [me, setMe] = useState(() => startPos(identity))
  const meRef = useRef(me)
  meRef.current = me
  const held = useRef(new Set())
  const lastPub = useRef(0)
  const poseTimer = useRef(null)

  const [burst, setBurst] = useState(null) // { kind, ts }
  const [metOnce, setMetOnce] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)

  const level = friendshipLevel(friendship)
  const myMood = myPet?.mood || 'happy'
  const partnerMood = moodFromSnapshot(partnerPet)
  const hasPartner = Boolean(partnerPet?.species)

  const partnerPos = partnerPark && typeof partnerPark.x === 'number'
    ? partnerPark
    : startPos(partner)

  const dx = me.x - partnerPos.x
  const dy = me.y - partnerPos.y
  const dist = Math.hypot(dx, dy)
  const near = hasPartner && partnerOnline && dist < MEET_DIST

  // publish my position/pose (throttled).
  const publish = useCallback((state) => {
    const now = Date.now()
    if (now - lastPub.current < PUBLISH_MS) return
    lastPub.current = now
    setParkState(rt, state)
  }, [rt])

  // movement loop.
  useEffect(() => {
    let raf
    const loop = () => {
      const dirs = held.current
      if (dirs.size > 0) {
        setMe((prev) => {
          let { x, y, dir } = prev
          if (dirs.has('left')) { x -= SPEED; dir = 'left' }
          if (dirs.has('right')) { x += SPEED; dir = 'right' }
          if (dirs.has('up')) y -= SPEED
          if (dirs.has('down')) y += SPEED
          const next = { x: clampX(x), y: clampY(y), dir, pose: 'walk' }
          publish(next)
          return next
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [publish])

  // stop -> settle to idle and publish final spot.
  const settle = useCallback(() => {
    if (held.current.size === 0) {
      setMe((prev) => {
        const next = { ...prev, pose: 'idle' }
        lastPub.current = 0
        setParkState(rt, next)
        return next
      })
    }
  }, [rt])

  // keyboard controls.
  useEffect(() => {
    const KEY = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
    }
    const down = (e) => {
      if (isTypingInField(e)) return
      const d = KEY[e.key]
      if (!d) return
      e.preventDefault()
      held.current.add(d)
    }
    const up = (e) => {
      if (isTypingInField(e)) return
      const d = KEY[e.key]
      if (!d) return
      held.current.delete(d)
      settle()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [settle])

  // publish an initial position on entering the park.
  useEffect(() => {
    setParkState(rt, meRef.current)
    return () => { if (poseTimer.current) clearTimeout(poseTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // briefly strike a pose (hi / play / sit / sleep / celebrate) and sync it.
  const strikePose = useCallback((pose, ms = 1800) => {
    setMe((prev) => {
      const next = { ...prev, pose }
      setParkState(rt, next)
      return next
    })
    if (poseTimer.current) clearTimeout(poseTimer.current)
    poseTimer.current = setTimeout(() => {
      setMe((prev) => {
        const next = { ...prev, pose: 'idle' }
        setParkState(rt, next)
        return next
      })
    }, ms)
  }, [rt])

  const showBurst = useCallback((kind) => {
    setBurst({ kind, ts: Date.now() })
    setTimeout(() => setBurst(null), 1700)
  }, [])

  // meeting detection.
  useEffect(() => {
    if (near && !metOnce) {
      setMetOnce(true)
      showBurst('meet')
      notify(randomMeet(), '😊')
      addFriendship(rt, 'meet')
    }
    if (!near && metOnce && dist > MEET_DIST + 6) {
      setMetOnce(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, dist])

  // react to interaction events from either pet.
  useNewEvents((e) => {
    if (!['hi', 'activity', 'gift', 'celebrate', 'special'].includes(e.type)) return
    const mine = e.from === identity
    // the receiver mirrors the pose so both pets animate together.
    if (!mine) {
      if (e.type === 'hi') strikePose('hi')
      else if (e.type === 'activity') strikePose(e.act)
      else if (e.type === 'celebrate') strikePose('celebrate')
    }
    showBurst(e.type === 'gift' ? `gift:${e.item}` : e.type)
  })

  // ---- interaction triggers ----
  const doHi = () => {
    strikePose('hi')
    emitEvent(rt, { type: 'hi' })
    addFriendship(rt, 'hi')
    showBurst('hi')
    notify('your pets said hi!', '👋')
  }

  const doActivity = (act, kind, msg) => {
    strikePose(act, act === 'sleep' ? 2600 : 1900)
    emitEvent(rt, { type: 'activity', act })
    addFriendship(rt, kind)
    showBurst(act)
    notify(msg, act === 'sit' ? '🪑' : act === 'sleep' ? '💤' : '🎾')
  }

  const doGift = (g) => {
    emitEvent(rt, { type: 'gift', to: partner, item: g.id })
    addFriendship(rt, 'gift')
    showBurst(`gift:${g.id}`)
    notify(`you gave ${partner}'s pet a ${g.label} ${g.emoji}`, g.emoji)
  }

  const doSpecial = () => {
    strikePose('celebrate', 2200)
    emitEvent(rt, { type: 'special', id: 'together', text: 'your pets share a special little moment ✨' })
    addFriendship(rt, 'play')
    showBurst('special')
    notify('a special moment ✨', '✨')
  }

  const midX = (me.x + partnerPos.x) / 2
  const midY = (me.y + partnerPos.y) / 2

  return (
    <div className="screen-enter park-screen">
      <div className="section-head">
        <span className="title-pixel">pet park</span>
        <span className="line" />
        <FriendshipStars points={friendship} size="sm" />
      </div>

      <div className="park">
        <div className="park-sky">
          <span className="sun" aria-hidden>☀️</span>
          <span className="cloud cloud-1" aria-hidden>☁️</span>
          <span className="cloud cloud-2" aria-hidden>☁️</span>
          <span className="cloud cloud-3" aria-hidden>☁️</span>
        </div>
        <div className="park-ground">
          <span className="tree tree-1" aria-hidden>🌳</span>
          <span className="tree tree-2" aria-hidden>🌲</span>
          <span className="tree tree-3" aria-hidden>🌳</span>
          <span className="flower fl-1" aria-hidden>🌷</span>
          <span className="flower fl-2" aria-hidden>🌼</span>
          <span className="flower fl-3" aria-hidden>🌸</span>
          <span className="flower fl-4" aria-hidden>🌻</span>
          <span className="bench" aria-hidden>🪑</span>
          <span className="ball" aria-hidden>⚽</span>
        </div>

        {/* my pet */}
        <div
          className={`park-pet pose-${me.pose}`}
          style={{ left: `${me.x}%`, top: `${me.y}%`, zIndex: Math.round(me.y) }}
        >
          <span className="park-name you">{myPet?.name || identity}</span>
          <Pet mood={myMood} species={myPet?.species} facing={me.dir} />
        </div>

        {/* partner pet */}
        {hasPartner && (
          <div
            className={`park-pet pose-${partnerPos.pose || 'idle'} ${partnerOnline ? '' : 'is-away'}`}
            style={{ left: `${partnerPos.x}%`, top: `${partnerPos.y}%`, zIndex: Math.round(partnerPos.y) }}
          >
            <span className="park-name">{partnerPet?.name || partner}{partnerOnline ? '' : ' 💤'}</span>
            <Pet mood={partnerMood} species={partnerPet.species} facing={partnerPos.dir || 'left'} />
          </div>
        )}

        {/* interaction burst between the pets */}
        {burst && (
          <div className="burst" style={{ left: `${midX}%`, top: `${midY - 6}%` }}>
            <BurstFx kind={burst.kind} />
          </div>
        )}

        {near && (
          <div className="meet-banner">together!</div>
        )}
      </div>

      {/* d-pad */}
      <div className="park-controls">
        <DPad held={held} onChange={settle} />
        <div className="park-actions">
          {!hasPartner && <p className="tiny muted center">waiting for {partner} to pick a pet</p>}
          {hasPartner && !partnerOnline && (
            <p className="tiny muted center">{partner} is away — walk around and wait for them</p>
          )}
          {hasPartner && partnerOnline && !near && (
            <p className="tiny muted center">walk closer to {partner}'s pet</p>
          )}
          {near && (
            <div className="action-grid">
              <button className="btn btn-pink" onClick={doHi}>say hi</button>
              {level >= UNLOCKS.play && (
                <button className="btn btn-cyan" onClick={() => doActivity('play', 'play', 'your pets play with the ball 🎾')}>play</button>
              )}
              {level >= UNLOCKS.sit && (
                <button className="btn btn-yellow" onClick={() => doActivity('sit', 'sit', 'your pets sit on the bench 🪑')}>sit together</button>
              )}
              {level >= UNLOCKS.sit && (
                <button className="btn btn-purple" onClick={() => doActivity('sleep', 'sleep', 'your pets take a nap together 💤')}>nap</button>
              )}
              {level >= UNLOCKS.gift && (
                <button className="btn btn-green" onClick={() => setGiftOpen(true)}>give gift</button>
              )}
              {level >= UNLOCKS.special && (
                <button className="btn btn-pink btn-glow" onClick={doSpecial}>special ✨</button>
              )}
            </div>
          )}
          {near && level < UNLOCKS.special && (
            <p className="tiny muted center">raise friendship to unlock more together</p>
          )}
        </div>
      </div>

      {giftOpen && (
        <GiftMenu partner={partner} onClose={() => setGiftOpen(false)} onGift={doGift} />
      )}
    </div>
  )
}

function BurstFx({ kind }) {
  if (kind && kind.startsWith('gift:')) {
    const g = giftById(kind.slice(5))
    return <span className="burst-emoji">{g.emoji}</span>
  }
  if (kind === 'sit') return <span className="burst-emoji">🪑</span>
  if (kind === 'play') return <span className="burst-emoji">🎾</span>
  if (kind === 'sleep') return <span className="burst-emoji">💤</span>
  if (kind === 'celebrate') return <span className="burst-emoji">🎉</span>
  if (kind === 'special') return (
    <>
      <span className="burst-emoji">✨</span>
      <span className="burst-star b">★</span>
    </>
  )
  // hi / meet -> stars
  return (
    <>
      <span className="burst-star a">★</span>
      <span className="burst-star b">★</span>
      <span className="burst-star c">★</span>
    </>
  )
}

function DPad({ held, onChange }) {
  const press = (dir) => (e) => {
    e.preventDefault()
    held.current.add(dir)
  }
  const release = (dir) => (e) => {
    e.preventDefault()
    held.current.delete(dir)
    onChange()
  }
  const bind = (dir) => ({
    onPointerDown: press(dir),
    onPointerUp: release(dir),
    onPointerLeave: release(dir),
    onPointerCancel: release(dir),
  })
  return (
    <div className="dpad" role="group" aria-label="move your pet">
      <button className="dpad-btn up" {...bind('up')} aria-label="up">▲</button>
      <button className="dpad-btn left" {...bind('left')} aria-label="left">◀</button>
      <button className="dpad-btn right" {...bind('right')} aria-label="right">▶</button>
      <button className="dpad-btn down" {...bind('down')} aria-label="down">▼</button>
    </div>
  )
}
