import { useCallback, useEffect, useRef, useState } from 'react'
import Pet from './Pet'
import TownScene from './TownScene'
import ArcadeRoom from './ArcadeRoom'
import TownGarden from './TownGarden'
import { CafeRoom, BoutiqueRoom } from './ShopRooms'
import { TOWN_ROOMS, clampTownPosition, defaultSpawn, exitDestination, roomOf, spotAt, stepTownWalk } from '../utils/town'
import { useLocalStorage } from '../hooks/useLocalStorage'
import '../styles/town.css'
import GiftMenu from './GiftMenu'
import { FriendshipStars } from './Friendship'
import { useRealtime, useWatch } from '../realtime/RealtimeContext'
import { setParkState, emitEvent, addFriendship } from '../realtime/world'
import { useNewEvents } from '../hooks/useWorldEvents'
import { moodFromSnapshot } from '../utils/petText'
import { friendshipLevel, UNLOCKS, randomMeet, giftById } from '../utils/social'
import { isTypingInField } from '../utils/keys'

// play-area bounds in percent of the park.
const MEET_DIST = 20 // proximity radius for interactions
const PUBLISH_MS = 90

const startPos = (identity, room = 'plaza', spawn) => ({
  ...clampTownPosition(spawn || defaultSpawn(identity, room), room),
  dir: identity === 'mehreenz' ? 'right' : 'left', pose: 'idle', room, active: true,
})

export default function PetPark({
  identity, partner, myPet, partnerPet, friendship, partnerOnline, notify, onVisit, onPlay, initialRoom = 'plaza', onRoomChange,
}) {
  const rt = useRealtime()
  const partnerPark = useWatch(`park/${partner}`)

  const [me, setMe] = useState(() => startPos(identity, initialRoom))
  const meRef = useRef(me)
  meRef.current = me
  const held = useRef(new Set())
  const lastPub = useRef(0)
  const poseTimer = useRef(null)
  const target = useRef(null)
  const burstTimer = useRef(null)
  const exitLock = useRef(0)
  const [stage, setStage] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [visits, setVisits] = useLocalStorage(`town-passport:${identity}`, {})
  const [destination, setDestination] = useState(null)

  const [burst, setBurst] = useState(null) // { kind, ts }
  const [metOnce, setMetOnce] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)

  const level = friendshipLevel(friendship)
  const myMood = myPet?.mood || 'happy'
  const partnerMood = moodFromSnapshot(partnerPet)
  const hasPartner = Boolean(partnerPet?.species)
  const room = roomOf(me)
  const roomInfo = TOWN_ROOMS[room]
  const discovered = Object.keys(TOWN_ROOMS).filter(id => visits?.[id] === true).length
  const nearby = spotAt(room, me)
  const partnerHere = hasPartner && partnerOnline && partnerPark?.active === true && roomOf(partnerPark) === room

  const partnerPos = partnerPark && typeof partnerPark.x === 'number'
    ? partnerPark
    : startPos(partner)

  const dx = me.x - partnerPos.x
  const dy = me.y - partnerPos.y
  const dist = Math.hypot(dx, dy)
  const near = partnerHere && dist < MEET_DIST

  useEffect(() => {
    setVisits(previous => previous?.[room] === true ? previous : { ...previous, [room]: true })
  }, [room, setVisits])

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
    let lastTime = null
    const loop = (time) => {
      const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const dirs = held.current
      const prev = meRef.current
      const direction = { x: Number(dirs.has('right')) - Number(dirs.has('left')), y: Number(dirs.has('down')) - Number(dirs.has('up')) }
      if (dirs.size && target.current) { target.current = null; setDestination(null) }
      if (direction.x || direction.y || target.current) {
        const result = stepTownWalk(prev, direction, target.current, dt, Date.now() > exitLock.current)
        target.current = result.target
        if (!result.target) setDestination(null)
        if (result.exit) {
          // A destination belongs to one room only. Do not keep walking into the
          // new room with an old click target, pose timer, or held direction.
          held.current.clear()
          clearTimeout(poseTimer.current)
          exitLock.current = Date.now() + 700
          setBurst(null)
          setMetOnce(false)
          setGiftOpen(false)
          onRoomChange?.(result.exit.to)
        }
        if (result.state !== prev) {
          meRef.current = result.state
          setMe(result.state)
          if (result.exit || result.state.pose === 'idle') lastPub.current = 0
          publish(result.state)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [onRoomChange, publish])

  // stop -> settle to idle and publish final spot.
  const settle = useCallback(() => {
    if (held.current.size === 0) {
      target.current = null
      setDestination(null)
      const next = { ...meRef.current, pose: 'idle' }
      meRef.current = next
      setMe(next)
      lastPub.current = 0
      setParkState(rt, next)
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
      if (isTypingInField(e) || e.target?.closest?.('select, [role="dialog"]')) return
      const d = KEY[e.key]
      if (e.code === 'Space' || e.key === 'Enter') {
        if (e.repeat || e.target?.closest?.('button, a')) return
        const spot = spotAt(roomOf(meRef.current), meRef.current)
        if (spot) { e.preventDefault(); useSpotRef.current(spot) }
        return
      }
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
    const blur = () => { held.current.clear(); settle() }
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [settle])

  // publish an initial position on entering the park.
  useEffect(() => {
    setParkState(rt, meRef.current)
    return () => {
      clearTimeout(poseTimer.current)
      clearTimeout(burstTimer.current)
      setParkState(rt, { ...meRef.current, active: false, pose: 'idle' })
    }
  }, [rt])

  const walkTo = (position) => {
    held.current.clear()
    clearTimeout(poseTimer.current)
    target.current = clampTownPosition(position, room)
    setDestination(target.current)
  }

  const useSpot = (spot) => {
    if (!spot) return
    held.current.clear()
    target.current = null
    settle()
    const act = spot.action
    if (act.startsWith('play:')) { onPlay?.(act.slice(5)); return }
    if (act === 'feed') { onVisit?.('feed'); return }
    if (act === 'look') { onVisit?.('pet'); return }
    if (act === 'sit') { strikePose('sit', 2200); notify('a nice little rest', '🪑'); return }
    if (act === 'coin') { notify('a wish for more adventures together. no coins needed.', '✨'); showBurst('special'); return }
    if (act === 'bakery') { notify('warm bread. your pet drools a little', '🍞'); return }
    if (act === 'lamp') { notify('the lamp glows just for you', '🏮'); return }
    if (act === 'mail') { notify('a postcard: “follow cherry row east. the garden needs two little helpers.”', '✉️'); return }
    if (act === 'cherry') { notify('petals everywhere', '🌸'); showBurst('special'); return }
    if (act === 'knock') { notify('nobody home. a cat stares from the window', '🐱'); return }
    if (act === 'swing') { strikePose('celebrate', 1600); notify('wee', '🌼'); return }
    if (act === 'boat') { notify('a tiny boat waves back', '⛵'); return }
    if (act === 'crate') { notify('just rope and one shiny pebble', '📦'); return }
    if (act === 'flower') { notify('pip the gardener: “pick a seed below and plant your three beds. your friend has three too!”', '🌷'); return }
    if (act === 'pond') { notify('something golden flickers under the water', '🐟'); return }
    if (act === 'butterfly') { strikePose('celebrate', 1600); notify('it lands on your pet for a second', '🦋'); return }
    if (act === 'rack') { notify('so many looks. the mirror is waiting', '🎀'); return }
  }
  const useSpotRef = useRef(useSpot)
  useSpotRef.current = useSpot

  // briefly strike a pose (hi / play / sit / sleep / celebrate) and sync it.
  const strikePose = useCallback((pose, ms = 1800) => {
    const next = { ...meRef.current, pose }
    meRef.current = next
    setMe(next)
    setParkState(rt, next)
    if (poseTimer.current) clearTimeout(poseTimer.current)
    poseTimer.current = setTimeout(() => {
      const idle = { ...meRef.current, pose: 'idle' }
      meRef.current = idle
      setMe(idle)
      setParkState(rt, idle)
    }, ms)
  }, [rt])

  const showBurst = useCallback((kind) => {
    setBurst({ kind, ts: Date.now() })
    clearTimeout(burstTimer.current)
    burstTimer.current = setTimeout(() => setBurst(null), 1700)
  }, [])

  // meeting detection.
  useEffect(() => {
    if (near && !metOnce) {
      setMetOnce(true)
      showBurst('meet')
      notify(randomMeet(), '😊')
      if (identity === 'ali') addFriendship(rt, 'meet')
    }
    if (!near && metOnce && dist > MEET_DIST + 6) {
      setMetOnce(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, dist])

  // react to interaction events from either pet.
  useNewEvents((e) => {
    if (!['hi', 'activity', 'gift', 'celebrate', 'special'].includes(e.type)) return
    if (e.room && e.room !== room) return
    if (e.from !== identity && !partnerHere) return
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
    emitEvent(rt, { type: 'hi', room })
    addFriendship(rt, 'hi')
    showBurst('hi')
    notify('your pets said hi!', '👋')
  }

  const doActivity = (act, kind, msg) => {
    strikePose(act, act === 'sleep' ? 2600 : 1900)
    emitEvent(rt, { type: 'activity', act, room })
    addFriendship(rt, kind)
    showBurst(act)
    notify(msg, act === 'sit' ? '🪑' : act === 'sleep' ? '💤' : '🎾')
  }

  const doGift = (g) => {
    emitEvent(rt, { type: 'gift', to: partner, item: g.id, room })
    addFriendship(rt, 'gift')
    showBurst(`gift:${g.id}`)
    notify(`you gave ${partner}'s pet a ${g.label} ${g.emoji}`, g.emoji)
  }

  const doSpecial = () => {
    strikePose('celebrate', 2200)
    emitEvent(rt, { type: 'special', id: 'together', room, text: 'your pets share a special little moment ✨' })
    addFriendship(rt, 'play')
    showBurst('special')
    notify('a special moment ✨', '✨')
  }

  const midX = partnerHere ? (me.x + partnerPos.x) / 2 : me.x
  const midY = partnerHere ? (me.y + partnerPos.y) / 2 : me.y

  return (
    <div className="screen-enter park-screen">
      <div className="section-head">
        <span className="title-pixel">your little world</span>
        <span className="line" />
        <FriendshipStars points={friendship} size="sm" />
      </div>
      <div className="town-hud">
        <div>
          <span className="title-pixel">{roomInfo.name}</span>
          <p className="hint">{roomInfo.subtitle}</p>
        </div>
        <div className="town-status"><span className={`town-presence ${partnerHere ? 'is-here' : ''}`}>
          {partnerHere ? 'both here'
            : hasPartner && partnerOnline && partnerPark?.active ? `${partner} is in ${TOWN_ROOMS[roomOf(partnerPark)]?.name || 'town'}`
              : 'walk to explore'}
        </span><button className="btn btn-purple town-map-toggle" aria-expanded={mapOpen} aria-controls="town-map" onClick={() => setMapOpen(!mapOpen)}>map · {discovered}/8</button></div>
      </div>

      {mapOpen && <section id="town-map" className="town-map panel" aria-label="town map">
        <div className="town-map-heading"><span className="title-pixel">the willow trail</span><span className="tiny muted">visit all 8 places · saved on this device</span></div>
        <div className="town-map-shops">{['arcade','cafe','boutique'].map(id => <span key={id} className={room === id ? 'map-current' : ''}>{visits?.[id] ? '✦ ' : '◇ '}{TOWN_ROOMS[id].name}</span>)}</div>
        <div className="town-map-streets">{['dock','west','plaza','east','garden'].map(id => <span key={id} className={room === id ? 'map-current' : ''}>{visits?.[id] ? '✦ ' : '◇ '}{TOWN_ROOMS[id].name}{room === id && <small>you are here</small>}</span>)}</div>
        <p>Shops open onto Willow Square. Walk left for the pier, right for the garden. Tap a sign to walk there.</p>
        {discovered === 8 && <p className="town-explorer">✦ little world explorer — every corner discovered!</p>}
      </section>}

      <div ref={setStage} className={`park town town-room-${room}`} aria-label={`${roomInfo.name} play area`} onPointerDown={(e) => {
        if (e.target.closest('button')) return
        const rect = e.currentTarget.getBoundingClientRect()
        walkTo({ x: (e.clientX - rect.left - e.currentTarget.clientLeft) / e.currentTarget.clientWidth * 100, y: (e.clientY - rect.top - e.currentTarget.clientTop) / e.currentTarget.clientHeight * 100 })
      }}>
        {['plaza', 'west', 'east', 'dock', 'garden'].includes(room) && <TownScene room={room} />}
        {room === 'arcade' && <ArcadeRoom />}
        {room === 'cafe' && <CafeRoom />}
        {room === 'boutique' && <BoutiqueRoom />}
        {!['arcade','cafe','boutique'].includes(room) && <div className="town-scene-label" aria-hidden="true"><i/>willow afterglow<span>little streets. big adventures.</span></div>}
        {roomInfo.exits.map(exit => {
          const point = exitDestination(exit, room)
          return <button key={exit.to} className={`town-exit town-exit-${exit.edge || 'door'}`} style={exit.zone ? {left:`${point.x}%`, top:`${point.y}%`} : undefined}
            onClick={() => walkTo(point)} aria-label={`walk to ${TOWN_ROOMS[exit.to].name}`}>{exit.edge === 'left' ? '‹ ' : exit.edge === 'bottom' ? '↓ ' : ''}{TOWN_ROOMS[exit.to].name}{exit.edge === 'right' ? ' ›' : exit.zone ? ' ↑' : ''}</button>
        })}
        {destination && <span className="town-destination" style={{left:`${destination.x}%`,top:`${destination.y}%`}} aria-hidden="true"/>}
        {nearby && (
          <button
            className="town-prompt"
            onClick={() => { target.current = null; held.current.clear(); settle(); useSpot(nearby) }}
          >
            {nearby.prompt}
          </button>
        )}

        {/* my pet */}
        <div
          className={`park-pet you-pet pose-${me.pose}`}
          style={{ left: `${me.x}%`, top: `${me.y}%`, zIndex: Math.round(me.y) }}
        >
          <span className="park-name you">{myPet?.name || identity}</span>
          <Pet mood={myMood} species={myPet?.species} color={myPet?.color} accessory={myPet?.accessory} facing={me.dir} />
        </div>

        {/* partner pet */}
        {partnerHere && (
          <div
            className={`park-pet pose-${partnerPos.pose || 'idle'} ${partnerOnline ? '' : 'is-away'}`}
            style={{ left: `${partnerPos.x}%`, top: `${partnerPos.y}%`, zIndex: Math.round(partnerPos.y) }}
          >
            <span className="park-name">{partnerPet?.name || partner}{partnerOnline ? '' : ' 💤'}</span>
            <Pet mood={partnerMood} species={partnerPet.species} color={partnerPet.color} accessory={partnerPet.accessory} facing={partnerPos.dir || 'left'} />
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

      <div className="town-instructions"><span>arrows / wasd to stroll</span><span>tap the ground to walk</span><span>space / enter to interact</span></div>
      <div className="town-places" aria-label="things to do here">{roomInfo.spots.map(spot => <button key={spot.id} className={nearby?.id === spot.id ? 'is-nearby' : ''}
        onClick={() => { if (nearby?.id === spot.id) useSpot(spot); else walkTo({x:spot.x+spot.w/2, y:spot.y+spot.h/2}) }}><span>{nearby?.id === spot.id ? '✦' : '◇'}</span>{spot.prompt}</button>)}</div>
      {room === 'garden' && <TownGarden identity={identity} stage={stage} notify={notify}/>}

      {/* d-pad */}
      <div className="park-controls">
        <DPad held={held} onChange={settle} />
        <div className="park-actions">
          {!hasPartner && <p className="tiny muted center">make yourself at home — your friend can join later</p>}
          {hasPartner && !partnerOnline && (
            <p className="tiny muted center">{partner} is away. walk the streets and see what you find.</p>
          )}
          {hasPartner && partnerOnline && !near && (
            <p className="tiny muted center">{partnerHere ? `walk closer to ${partner}'s pet` : partnerPark?.active ? `${partner} is in ${TOWN_ROOMS[roomOf(partnerPark)].name}` : `${partner} is elsewhere in the arcade`}</p>
          )}
          {near && (
            <div className="action-grid">
              <button className="btn btn-pink" onClick={doHi}>say hi</button>
              <button className="btn btn-purple" onClick={() => doActivity('celebrate', 'play', 'little paws, big dance energy ✨')}>dance together</button>
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
