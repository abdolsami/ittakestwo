import { useCallback, useEffect, useRef, useState } from 'react'
import { pacmanReward } from '../utils/rewards'
import { useRealtime, useWatch, useWatchRef, usePartnerOnline } from '../realtime/RealtimeContext'
import { usePlayTogether } from '../hooks/usePlayTogether'
import { useGameLoop } from '../hooks/useGameLoop'
import PlayInvite from '../components/PlayInvite'
import { setPacmanSession, setPacmanPlayer, clearPacmanPlayer, setPacmanWorld } from '../realtime/world'
import { getAnimal } from '../utils/animals'
import { accessoryOf, drawAccessory, looksFor } from '../utils/appearance'
import { shouldPublish } from '../utils/publish'
import { get2d, makeLayer } from '../utils/canvas'
import { isTypingInField } from '../utils/keys'
import './games.css'

const MAZE = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '####.#.......#.####',
  '####.#.##-##.#.####',
  '    ...#GGG#...    ',
  '####.#.#####.#.####',
  '####.#.......#.####',
  '####.#.#####.#.####',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#..#...........#..#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#o...............o#',
  '###################',
]

const ROWS = MAZE.length
const COLS = MAZE[0].length
const CELL = 20
const HUD = 36
const WIDTH = COLS * CELL
const HEIGHT = ROWS * CELL + HUD
const COUNTDOWN = 1600
const EPS = 1e-4
const HOUSE = { x: 9, y: 9 }
const EXIT = { x: 9, y: 7 }
const FRUIT_SPOT = { x: 9, y: 11 }
const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]
const GHOST_META = [
  { id: 'blinky', color: '#ff5f6d', scatter: { x: COLS - 2, y: 1 } },
  { id: 'pinky', color: '#ff8ec8', scatter: { x: 1, y: 1 } },
  { id: 'inky', color: '#4be0e0', scatter: { x: COLS - 2, y: ROWS - 2 } },
  { id: 'clyde', color: '#ffb347', scatter: { x: 1, y: ROWS - 2 } },
]

function wrapX(x) {
  if (x < -0.5) return x + COLS
  if (x >= COLS - 0.5) return x - COLS
  return x
}

function tileChar(tiles, x, y) {
  const tx = ((Math.round(x) % COLS) + COLS) % COLS
  const ty = Math.round(y)
  if (ty < 0 || ty >= ROWS) return '#'
  return tiles[ty][tx]
}

function blocked(tiles, x, y, who) {
  const ch = tileChar(tiles, x, y)
  if (ch === '#') return true
  if (who === 'player' && (ch === 'G' || ch === '-')) return true
  return false
}

function aligned(pos) {
  return Math.abs(pos - Math.round(pos)) < EPS
}

function distToNextCell(pos, dir) {
  if (dir > 0) return Math.floor(pos + EPS) + 1 - pos
  if (dir < 0) return pos - Math.floor(pos)
  return 0
}

function cloneMaze() {
  return MAZE.map((row) => row.split(''))
}

function countPellets(tiles) {
  let n = 0
  for (const row of tiles) {
    for (const ch of row) if (ch === '.' || ch === 'o') n++
  }
  return n
}

function mazePellet(r, c) {
  const ch = MAZE[r]?.[c]
  return ch === '.' || ch === 'o' ? ch : null
}

function spawnFor(identity, duo) {
  if (!duo) return { x: 9, y: 15, dir: { x: -1, y: 0 } }
  if (identity === 'ali') return { x: 12, y: 15, dir: { x: -1, y: 0 } }
  return { x: 6, y: 15, dir: { x: 1, y: 0 } }
}

function makeGhosts() {
  return GHOST_META.map((g, i) => ({
    id: g.id,
    color: g.color,
    scatter: g.scatter,
    x: i === 0 ? 9 : 8 + Math.min(i, 2),
    y: i === 0 ? 7 : 9,
    dir: { x: i === 0 ? -1 : 0, y: i === 0 ? 0 : -1 },
    mode: 'scatter',
    eaten: false,
  }))
}

function packGhosts(ghosts) {
  return ghosts.map((g) => ({
    id: g.id,
    x: +g.x.toFixed(3),
    y: +g.y.toFixed(3),
    dx: g.dir.x,
    dy: g.dir.y,
    mode: g.mode,
    eaten: !!g.eaten,
  }))
}

function unpackGhosts(list) {
  const raw = Array.isArray(list) ? list : Object.values(list || {})
  return raw.map((g) => {
    const base = GHOST_META.find((b) => b.id === g.id) || GHOST_META[0]
    return {
      id: g.id,
      color: base.color,
      scatter: base.scatter,
      x: g.x,
      y: g.y,
      dir: { x: g.dx || 0, y: g.dy || 0 },
      mode: g.mode || 'chase',
      eaten: !!g.eaten,
    }
  })
}

function listFrom(value) {
  if (!value) return []
  return Array.isArray(value) ? value : Object.values(value)
}

function wrapDiff(a, b) {
  let d = a - b
  if (d > COLS / 2) d -= COLS
  if (d < -COLS / 2) d += COLS
  return d
}

function moveOnGrid(actor, dt, speed, tiles, who, chooseDir) {
  let left = speed * dt
  if (left <= 0) return

  for (let i = 0; i < 4 && left > EPS; i += 1) {
    const gx = Math.round(actor.x)
    const gy = Math.round(actor.y)
    const onCell = aligned(actor.x) && aligned(actor.y)

    if (onCell) {
      actor.x = gx
      actor.y = gy
      chooseDir(actor)
      if (!actor.dir.x && !actor.dir.y) return
      if (blocked(tiles, actor.x + actor.dir.x, actor.y + actor.dir.y, who)) {
        actor.dir = { x: 0, y: 0 }
        return
      }
    }

    const dir = actor.dir.x !== 0 ? actor.dir.x : actor.dir.y
    if (!dir) return
    const pos = actor.dir.x !== 0 ? actor.x : actor.y
    const toCell = onCell ? 1 : distToNextCell(pos, dir)
    const step = Math.min(left, Math.max(toCell, EPS))
    actor.x = wrapX(actor.x + actor.dir.x * step)
    actor.y += actor.dir.y * step
    left -= step
  }
}

function choosePlayerDir(p, tiles) {
  const queued = p.nextDir
  if (queued && (queued.x || queued.y) && !blocked(tiles, p.x + queued.x, p.y + queued.y, 'player')) {
    p.dir = { x: queued.x, y: queued.y }
  }
  if (p.dir.x || p.dir.y) p.face = { x: p.dir.x, y: p.dir.y }
}

function houseTile(x, y) {
  const ch = MAZE[Math.round(y)]?.[((Math.round(x) % COLS) + COLS) % COLS]
  return ch === 'G' || ch === '-'
}

function reviveGhost(g) {
  g.eaten = false
  g.x = EXIT.x
  g.y = EXIT.y
  g.dir = { x: -1, y: 0 }
  g.mode = 'scatter'
}

function ghostTarget(g, player) {
  if (g.eaten) {
    const onDoor = Math.abs(g.x - EXIT.x) <= 0.2
    if (onDoor && g.y >= EXIT.y - 0.05) return HOUSE
    return EXIT
  }
  if (g.mode === 'fright') return null
  if (g.mode === 'scatter') return g.scatter
  const px = player.x
  const py = player.y
  const pd = player.dir || { x: 0, y: 0 }
  if (g.id === 'pinky') return { x: px + pd.x * 4, y: py + pd.y * 4 }
  if (g.id === 'inky') return { x: px + pd.x * 2, y: py + pd.y * 2 }
  if (g.id === 'clyde') {
    return Math.hypot(px - g.x, py - g.y) < 8 ? g.scatter : { x: px, y: py }
  }
  return { x: px, y: py }
}

function chooseGhostDir(g, tiles, player) {
  const target = ghostTarget(g, player)
  const forward = DIRS.filter((d) => {
    if (d.x === -g.dir.x && d.y === -g.dir.y) return false
    return !blocked(tiles, g.x + d.x, g.y + d.y, 'ghost')
  })
  const options = forward.length ? forward : DIRS.filter((d) => !blocked(tiles, g.x + d.x, g.y + d.y, 'ghost'))
  if (!options.length) return
  if (!target) {
    g.dir = options[Math.floor(Math.random() * options.length)]
    return
  }
  let best = options[0]
  let bestD = Infinity
  for (const d of options) {
    const dist = (g.x + d.x - target.x) ** 2 + (g.y + d.y - target.y) ** 2
    const same = d.x === g.dir.x && d.y === g.dir.y
    if (dist < bestD - 0.05 || (Math.abs(dist - bestD) <= 0.05 && same)) {
      bestD = dist
      best = d
    }
  }
  g.dir = { x: best.x, y: best.y }
}

export default function PacMan({ onExit, onFinish, highScore, mySpecies, myColor, myAccessory }) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const { ask, together, solo, playTogether, playSolo } = usePlayTogether('pacman')
  const session = useWatch('games/pacman/session')
  const partnerRef = useWatchRef(`games/pacman/players/${partner}`)
  const worldRef = useWatchRef('games/pacman/world')
  const partnerPet = useWatch(`pets/${partner}`)

  const canvasRef = useRef(null)
  const tilesRef = useRef(cloneMaze())
  const playerRef = useRef(null)
  const ghostsRef = useRef(makeGhosts())
  const eatenRef = useRef(new Set())
  const fruitRef = useRef(null)
  const fruitTakenRef = useRef(false)
  const ateGhostsRef = useRef([])
  const seenGhostEatsRef = useRef(new Set())

  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const levelRef = useRef(1)
  const frightRef = useRef(0)
  const comboRef = useRef(0)
  const invulnRef = useRef(0)
  const modeClockRef = useRef(0)
  const roundRef = useRef(0)
  const startAtRef = useRef(null)
  const lastTimeRef = useRef(0)
  const lastPubRef = useRef(0)
  const lastWorldRef = useRef(0)
  const seqRef = useRef(0)
  const lastWorldSeqRef = useRef(0)
  const finishedRef = useRef(false)
  const runningRef = useRef(false)
  const duoRef = useRef(false)
  const hostRef = useRef(false)

  const partnerDrawRef = useRef({ x: 0, y: 0, ready: false })
  const ghostDrawRef = useRef([])
  const lastPayloadRef = useRef('')
  const lastWorldPayloadRef = useRef('')
  const lastEatenCountRef = useRef(-1)
  const lastWorldEatenRef = useRef(-1)

  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [best, setBest] = useState(highScore || 0)
  const [reward, setReward] = useState(null)

  const myAnimal = { ...looksFor(mySpecies, myColor), accessory: accessoryOf(myAccessory) }
  const theirAnimal = { ...looksFor(partnerPet?.species, partnerPet?.color), accessory: accessoryOf(partnerPet?.accessory) }
  const duoHud = together || (!solo && partnerOnline)

  const frightForLevel = () => Math.max(4.6, 6.2 - (levelRef.current - 1) * 0.4)

  const startFright = useCallback(() => {
    frightRef.current = frightForLevel()
    comboRef.current = 0
    if (!hostRef.current && duoRef.current) return
    for (const g of ghostsRef.current) {
      if (!g.eaten) g.dir = { x: -g.dir.x, y: -g.dir.y }
    }
  }, [])

  const applyEatenKey = useCallback((key, award) => {
    if (!key || eatenRef.current.has(key)) return false
    const [rs, cs] = String(key).split(',')
    const r = +rs
    const c = +cs
    const kind = mazePellet(r, c)
    if (!kind) return false
    eatenRef.current.add(key)
    if (tilesRef.current[r]) tilesRef.current[r][c] = ' '
    if (kind === 'o') startFright()
    if (award) scoreRef.current += kind === 'o' ? 50 : 10
    return true
  }, [startFright])

  const mergeEaten = useCallback((list, award) => {
    for (const key of listFrom(list)) applyEatenKey(key, award)
  }, [applyEatenKey])

  const publishMe = useCallback((force) => {
    if (!duoRef.current) return
    const now = Date.now()
    if (!force && now - lastPubRef.current < 40) return
    lastPubRef.current = now
    const p = playerRef.current
    if (!p) return
    const payload = {
      x: +p.x.toFixed(3),
      y: +p.y.toFixed(3),
      dx: p.dir.x,
      dy: p.dir.y,
      score: scoreRef.current,
      lives: livesRef.current,
      alive: runningRef.current && livesRef.current > 0,
      powered: frightRef.current > 0,
      ateGhosts: ateGhostsRef.current,
      fruitTake: fruitTakenRef.current,
      level: levelRef.current,
      round: roundRef.current,
    }
    if (force || eatenRef.current.size !== lastEatenCountRef.current) {
      payload.eaten = [...eatenRef.current]
      lastEatenCountRef.current = eatenRef.current.size
    }
    if (!force && !shouldPublish(lastPayloadRef, payload)) return
    setPacmanPlayer(rt, payload)
  }, [rt])

  const publishWorld = useCallback((force) => {
    if (!duoRef.current || !hostRef.current) return
    const now = Date.now()
    if (!force && now - lastWorldRef.current < 80) return
    lastWorldRef.current = now
    const payload = {
      ghosts: packGhosts(ghostsRef.current),
      frightLeft: +frightRef.current.toFixed(2),
      level: levelRef.current,
      fruit: fruitRef.current,
      round: roundRef.current,
    }
    if (force || eatenRef.current.size !== lastWorldEatenRef.current) {
      payload.eaten = [...eatenRef.current]
      lastWorldEatenRef.current = eatenRef.current.size
    }
    if (!force && !shouldPublish(lastWorldPayloadRef, payload)) return
    seqRef.current += 1
    setPacmanWorld(rt, { ...payload, seq: seqRef.current })
  }, [rt])

  const resetActors = useCallback(() => {
    const spawn = spawnFor(rt.identity, duoRef.current)
    playerRef.current = {
      x: spawn.x,
      y: spawn.y,
      dir: { ...spawn.dir },
      nextDir: { ...spawn.dir },
      face: { ...spawn.dir },
    }
    if (hostRef.current || !duoRef.current) ghostsRef.current = makeGhosts()
    frightRef.current = 0
    comboRef.current = 0
    invulnRef.current = 1.4
    modeClockRef.current = 0
    ateGhostsRef.current = []
  }, [rt.identity])

  const refillMaze = useCallback((nextLevel) => {
    tilesRef.current = cloneMaze()
    dotsSig = -1
    eatenRef.current = new Set()
    fruitRef.current = null
    fruitTakenRef.current = false
    levelRef.current = nextLevel
    setLevel(nextLevel)
    resetActors()
  }, [resetActors])

  const finishRound = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    runningRef.current = false
    const s = scoreRef.current
    const isHigh = s > (highScore || 0)
    setBest((b) => Math.max(b, s))
    const r = pacmanReward(s, levelRef.current)
    setScore(s)
    setReward({ ...r, isHigh })
    setPhase('over')
    publishMe(true)
    onFinish(r, s, isHigh)
  }, [highScore, onFinish, publishMe])

  const beginRound = useCallback((startAt, round, duo, host) => {
    duoRef.current = duo
    hostRef.current = !duo || host
    roundRef.current = round
    startAtRef.current = startAt
    finishedRef.current = false
    runningRef.current = true
    lastTimeRef.current = 0
    seqRef.current = 0
    lastWorldSeqRef.current = 0
    lastEatenCountRef.current = -1
    lastWorldEatenRef.current = -1
    ghostDrawRef.current = []
    dotsSig = -1
    seenGhostEatsRef.current = new Set()
    scoreRef.current = 0
    livesRef.current = 3
    setScore(0)
    setLives(3)
    setReward(null)
    refillMaze(1)
    setPhase('running')
    publishMe(true)
    publishWorld(true)
  }, [publishMe, publishWorld, refillMaze])

  const startRound = useCallback(() => {
    const duo = together || (!solo && partnerOnline)
    const round = Math.max(Date.now(), (session && session.round) || 0, roundRef.current) + 1
    const startAt = Date.now() + COUNTDOWN
    beginRound(startAt, round, duo, true)
    if (duo) setPacmanSession(rt, { startAt, round, by: rt.identity, duo: true })
  }, [together, solo, partnerOnline, session, beginRound, rt])

  useEffect(() => {
    if (!together) return
    if (!session || session.round == null) return
    if (session.round <= roundRef.current) return
    beginRound(session.startAt, session.round, true, session.by === rt.identity)
  }, [together, session, beginRound, rt.identity])

  const queueDir = useCallback((x, y) => {
    if (!runningRef.current || !playerRef.current) return
    playerRef.current.nextDir = { x, y }
  }, [])

  const loseLife = useCallback(() => {
    if (invulnRef.current > 0 || !runningRef.current) return
    livesRef.current -= 1
    setLives(livesRef.current)
    if (livesRef.current <= 0) {
      finishRound()
      return
    }
    resetActors()
    publishMe(true)
    publishWorld(true)
  }, [finishRound, resetActors, publishMe, publishWorld])

  const syncIncoming = () => {
    if (!duoRef.current) return
    const partnerLive = partnerRef.current
    if (partnerLive && partnerLive.round === roundRef.current) {
      mergeEaten(partnerLive.eaten, false)
      if (hostRef.current) {
        for (const id of listFrom(partnerLive.ateGhosts)) {
          const tag = `${partnerLive.round}:${id}`
          if (seenGhostEatsRef.current.has(tag)) continue
          seenGhostEatsRef.current.add(tag)
          const ghost = ghostsRef.current.find((g) => g.id === id)
          if (ghost && !ghost.eaten) ghost.eaten = true
        }
        if (partnerLive.fruitTake) {
          fruitRef.current = null
          fruitTakenRef.current = true
        }
      }
    }
    if (hostRef.current) return
    const w = worldRef.current
    if (!w || w.round !== roundRef.current) return
    if ((w.seq || 0) <= lastWorldSeqRef.current) return
    lastWorldSeqRef.current = w.seq || 0
    mergeEaten(w.eaten, false)
    if (w.ghosts) ghostsRef.current = unpackGhosts(w.ghosts)
    if (typeof w.frightLeft === 'number') frightRef.current = Math.max(frightRef.current, w.frightLeft)
    fruitRef.current = w.fruit || null
    if (typeof w.level === 'number' && w.level > levelRef.current) refillMaze(w.level)
  }

  useGameLoop((time) => {
    const last = lastTimeRef.current || time
    const dt = Math.min(0.05, (time - last) / 1000)
    lastTimeRef.current = time
    syncIncoming()
    const started = startAtRef.current != null && Date.now() >= startAtRef.current
    const player = playerRef.current
    const tiles = tilesRef.current
    const live = runningRef.current && started && player && livesRef.current > 0

    if (live) {
        invulnRef.current = Math.max(0, invulnRef.current - dt)
        if (frightRef.current > 0) {
          frightRef.current = Math.max(0, frightRef.current - dt)
          if (frightRef.current === 0) comboRef.current = 0
        }

        const lvl = levelRef.current
        moveOnGrid(player, dt, 6.3 + Math.min(1.1, (lvl - 1) * 0.12), tiles, 'player', (p) => choosePlayerDir(p, tiles))

        const tx = ((Math.round(player.x) % COLS) + COLS) % COLS
        const ty = Math.round(player.y)
        if (ty >= 0 && ty < ROWS) applyEatenKey(`${ty},${tx}`, true)

        const host = !duoRef.current || hostRef.current
        if (host) {
          if (!fruitRef.current && !fruitTakenRef.current && eatenRef.current.size >= 40) {
            fruitRef.current = { x: FRUIT_SPOT.x, y: FRUIT_SPOT.y, left: 8 }
          }
          if (fruitRef.current) {
            fruitRef.current.left -= dt
            if (fruitRef.current.left <= 0) {
              fruitRef.current = null
              fruitTakenRef.current = true
            }
          }

          modeClockRef.current += dt
          const scatter = modeClockRef.current % 24 < 7
          const ghostSpeed = (frightRef.current > 0 ? 3.6 : 5.4) + Math.min(1.15, (lvl - 1) * 0.1)
          for (const g of ghostsRef.current) {
            if (g.eaten && houseTile(g.x, g.y)) {
              reviveGhost(g)
              continue
            }
            g.mode = g.eaten ? 'eyes' : (frightRef.current > 0 ? 'fright' : (scatter ? 'scatter' : 'chase'))
            const speed = g.eaten ? 9.2 : ghostSpeed
            const others = duoRef.current ? [player, partnerAsPlayer(partnerRef.current, roundRef.current)] : [player]
            const hunt = closestPlayer(g, others.filter(Boolean))
            moveOnGrid(g, dt, speed, tiles, 'ghost', (ghost) => chooseGhostDir(ghost, tiles, hunt || player))
            if (g.eaten && houseTile(g.x, g.y)) reviveGhost(g)
          }

          if (countPellets(tiles) <= 0) {
            refillMaze(levelRef.current + 1)
            publishWorld(true)
          }
        }

        if (fruitRef.current && Math.abs(player.x - fruitRef.current.x) < 0.45 && Math.abs(player.y - fruitRef.current.y) < 0.45) {
          scoreRef.current += 100
          fruitRef.current = null
          fruitTakenRef.current = true
        }

        if (invulnRef.current === 0) {
          for (const g of ghostsRef.current) {
            if (g.eaten) continue
            if (Math.abs(wrapDiff(player.x, g.x)) > 0.46 || Math.abs(player.y - g.y) > 0.46) continue
            if (frightRef.current > 0) {
              g.eaten = true
              comboRef.current += 1
              scoreRef.current += 200 * (2 ** (comboRef.current - 1))
              if (!ateGhostsRef.current.includes(g.id)) ateGhostsRef.current = [...ateGhostsRef.current, g.id]
            } else {
              loseLife()
              break
            }
          }
        }

        publishMe(false)
        publishWorld(false)
      }

      drawFrame({
        canvas: canvasRef.current,
        tiles,
        player,
        ghosts: (!duoRef.current || hostRef.current)
          ? ghostsRef.current
          : smoothGhosts(ghostsRef.current, ghostDrawRef),
        fruit: fruitRef.current,
        score: scoreRef.current,
        lives: livesRef.current,
        level: levelRef.current,
        fright: frightRef.current,
        invuln: invulnRef.current,
        started,
        startAt: startAtRef.current,
        myAnimal,
        partner: duoRef.current ? smoothPartner(partnerRef.current, partnerDrawRef, roundRef.current) : null,
        partnerAnimal: theirAnimal,
        round: roundRef.current,
      })
  })

  useEffect(() => () => clearPacmanPlayer(rt), [rt])

  useEffect(() => {
    const handler = (e) => {
      if (isTypingInField(e)) return
      if (!runningRef.current) return
      const map = {
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      queueDir(dir[0], dir[1])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [queueDir])

  const [hudThem, setHudThem] = useState(null)
  useEffect(() => {
    const id = setInterval(() => {
      const ps = partnerRef.current
      setHudThem(ps && ps.round === roundRef.current ? (ps.score ?? 0) : null)
      setScore(scoreRef.current)
    }, 140)
    return () => clearInterval(id)
  }, [partnerRef])
  const partnerScore = hudThem

  return (
    <div className="game-wrap screen-enter">
      <div className="game-header">
        <button className="back-btn" onClick={onExit}>‹ back</button>
        <span className="g-title">pac-man{duoHud ? ' · 2P' : ''}</span>
        <span className="score-line"><b>{best}</b> best</span>
      </div>

      {duoHud && phase !== 'idle' && (
        <div className="flappy-scorebar">
          <span className="fs-me">you <b>{score}</b></span>
          <span className="fs-vs">one maze</span>
          <span className="fs-them">
            {partner} <b>{partnerScore == null ? (partnerOnline ? '—' : 'away') : partnerScore}</b>
          </span>
        </div>
      )}

      <div className="pacman-stage" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="canvas-stage" width={WIDTH} height={HEIGHT} />

        {ask && (
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,15,0.78)' }}>
            <PlayInvite game="pacman" partner={partner} onTogether={playTogether} onSolo={playSolo} />
          </div>
        )}
        {phase === 'idle' && !ask && (
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,15,0.72)' }}>
            <div className="game-over-card">
              <div className="go-title">pac-man</div>
              <div className="go-msg">
                {solo || !partnerOnline
                  ? `guide ${myAnimal.label} through the maze. eat every pellet. don't get caught.`
                  : `you and ${partner} share one maze as your pets. eat pellets, dodge ghosts, and race for the high score.`}
              </div>
              <button className="btn btn-pink mt-16" onClick={startRound}>start</button>
            </div>
          </div>
        )}
      </div>

      <div className="mobile-controls">
        <div className="dpad">
          <button style={{ gridColumn: 2 }} onClick={() => queueDir(0, -1)}>↑</button>
          <button onClick={() => queueDir(-1, 0)}>←</button>
          <button onClick={() => queueDir(0, 1)}>↓</button>
          <button onClick={() => queueDir(1, 0)}>→</button>
        </div>
      </div>

      <p className="hint center">arrows or wasd · pellets power up · 3 lives</p>

      {phase === 'over' && reward && (
        <div className="overlay">
          <div className="game-over-card">
            <div className="go-title">{reward.isHigh ? 'new high score' : 'game over'}</div>
            <div className="go-msg">
              {reward.message}<br />
              score <b style={{ color: 'var(--yellow)' }}>{score}</b>
              {level > 1 && <> · level <b style={{ color: 'var(--cyan)' }}>{level}</b></>}
              {partnerScore != null && <> · {partner} <b style={{ color: 'var(--cyan)' }}>{partnerScore}</b></>}
            </div>
            <div className="reward-list">
              <span className="chip chip-xp">+{reward.xp} xp</span>
              <span className="chip chip-coins">+{reward.coins} coins</span>
              <span className="chip" style={{ color: 'var(--yellow)' }}>+{reward.hunger} food</span>
              <span className="chip" style={{ color: 'var(--pink)' }}>+{reward.happiness} happy</span>
            </div>
            <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button className="btn btn-pink" onClick={startRound}>play again</button>
              <button className="btn btn-purple" onClick={onExit}>back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function smoothGhosts(ghosts, drawRef) {
  if (!ghosts || !ghosts.length) return ghosts
  const drawn = drawRef.current
  if (!drawn.length || drawn.length !== ghosts.length) {
    drawRef.current = ghosts.map((g) => ({ ...g, dir: { ...g.dir } }))
    return drawRef.current
  }
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i]
    const d = drawn[i]
    if (d.id !== g.id) {
      drawn[i] = { ...g, dir: { ...g.dir } }
      continue
    }
    d.x += (g.x - d.x) * 0.4
    d.y += (g.y - d.y) * 0.4
    d.dir = g.dir
    d.mode = g.mode
    d.eaten = g.eaten
    d.color = g.color
  }
  return drawn
}

function smoothPartner(state, drawRef, round) {
  if (!state || state.round !== round || state.alive === false) {
    drawRef.current.ready = false
    return null
  }
  if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return null
  const d = drawRef.current
  if (!d.ready) {
    d.x = state.x
    d.y = state.y
    d.ready = true
  } else {
    d.x += (state.x - d.x) * 0.38
    d.y += (state.y - d.y) * 0.38
  }
  return { ...state, x: d.x, y: d.y }
}

function partnerAsPlayer(state, round) {
  if (!state || state.round !== round || state.alive === false) return null
  if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return null
  return { x: state.x, y: state.y, dir: { x: state.dx || 0, y: state.dy || 0 } }
}

function closestPlayer(ghost, players) {
  let best = null
  let bestD = Infinity
  for (const p of players) {
    const d = wrapDiff(p.x, ghost.x) ** 2 + (p.y - ghost.y) ** 2
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

function drawFrame(s) {
  const canvas = s.canvas
  if (!canvas) return
  const ctx = get2d(canvas)
  ctx.fillStyle = '#07021a'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = '#100428'
  ctx.fillRect(0, 0, WIDTH, HUD)
  ctx.fillStyle = '#ffd84b'
  ctx.font = 'bold 13px "Press Start 2P", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(String(s.score).padStart(6, '0'), 10, 24)
  ctx.fillStyle = '#4be0e0'
  ctx.font = 'bold 9px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`lvl ${s.level}`, WIDTH / 2, 22)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#b79fd6'
  ctx.fillText('lives', WIDTH - 10, 14)
  for (let i = 0; i < s.lives; i += 1) {
    drawPet(ctx, WIDTH - 16 - i * 18, 26, 7, s.myAnimal, { x: -1, y: 0 }, 0, 1)
  }

  ctx.save()
  ctx.translate(0, HUD)
  drawMaze(ctx, s.tiles, s.fright)

  if (s.fruit) {
    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🍒', s.fruit.x * CELL + CELL / 2, s.fruit.y * CELL + CELL / 2)
    ctx.textBaseline = 'alphabetic'
  }

  const t = performance.now() / 1000
  if (s.partner && s.partner.round === s.round && s.partner.alive !== false) {
    ctx.globalAlpha = s.partner.powered ? 0.8 : 0.92
    drawPet(
      ctx,
      s.partner.x * CELL + CELL / 2,
      s.partner.y * CELL + CELL / 2,
      9,
      s.partnerAnimal,
      { x: s.partner.dx || 0, y: s.partner.dy || 0 },
      t,
      1,
      true,
      Boolean(s.partner.dx || s.partner.dy),
    )
    ctx.globalAlpha = 1
  }

  if (s.player) {
    const flash = s.invuln > 0 && Math.floor(t * 12) % 2 === 0
    if (!flash) {
      drawPet(
        ctx,
        s.player.x * CELL + CELL / 2,
        s.player.y * CELL + CELL / 2,
        9.5,
        s.myAnimal,
        s.player.face || s.player.dir,
        t,
        1,
        true,
        Boolean(s.player.dir.x || s.player.dir.y),
      )
    }
  }

  for (const g of s.ghosts) drawGhost(ctx, g, s.fright, t)

  if (!s.started && s.startAt) {
    const remain = Math.ceil((s.startAt - Date.now()) / (COUNTDOWN / 3))
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, WIDTH, ROWS * CELL)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 52px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(String(Math.max(1, Math.min(3, remain))), WIDTH / 2, ROWS * CELL / 2 + 16)
    ctx.fillStyle = '#ffd84b'
    ctx.font = 'bold 14px "Press Start 2P", monospace'
    ctx.fillText('ready!', WIDTH / 2, ROWS * CELL / 2 + 56)
  }
  ctx.restore()
}

let wallLayer = null
function wallsLayer() {
  if (wallLayer) return wallLayer
  wallLayer = makeLayer(WIDTH, ROWS * CELL, (ctx) => {
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        if (MAZE[r][c] !== '#') continue
        const x = c * CELL
        const y = r * CELL
        ctx.fillStyle = '#1b0f46'
        ctx.fillRect(x, y, CELL, CELL)
        ctx.strokeStyle = '#6a4bff'
        ctx.lineWidth = 2
        ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6)
        ctx.strokeStyle = 'rgba(75,224,224,0.55)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 5, y + 5, CELL - 10, CELL - 10)
      }
    }
  })
  return wallLayer
}

let dotsLayer = null
let dotsSig = -1
function pelletsLayer(tiles) {
  let n = 0
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (tiles[r][c] === '.') n += 1
    }
  }
  if (dotsLayer && dotsSig === n) return dotsLayer
  dotsSig = n
  dotsLayer = makeLayer(WIDTH, ROWS * CELL, (ctx) => {
    ctx.fillStyle = '#ffe7a8'
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        if (tiles[r][c] !== '.') continue
        ctx.beginPath()
        ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 2.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })
  return dotsLayer
}

function drawMaze(ctx, tiles, fright) {
  ctx.drawImage(wallsLayer(), 0, 0)
  ctx.drawImage(pelletsLayer(tiles), 0, 0)
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const ch = tiles[r][c]
      if (ch !== '-' && ch !== 'o') continue
      const x = c * CELL
      const y = r * CELL
      if (ch === '-') {
        ctx.fillStyle = '#ffb3de'
        ctx.fillRect(x + 2, y + CELL / 2 - 1, CELL - 4, 3)
      } else {
        const pulse = 3.6 + Math.sin(performance.now() / 180) * 1.1
        ctx.fillStyle = fright > 0 ? '#4be0e0' : '#fff4c8'
        ctx.beginPath()
        ctx.arc(x + CELL / 2, y + CELL / 2, pulse, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function chompOpen(t) {
  const wave = 0.5 - 0.5 * Math.cos(t * Math.PI * 11)
  return 0.06 + wave * 0.48
}

function roundedBox(ctx, x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawPetEars(ctx, a, half) {
  if (a.ear === 'none') return
  if (a.ear === 'long') {
    ctx.fillStyle = '#241a3d'
    ctx.fillRect(-half + 1, -half - 8, 5, 9)
    ctx.fillRect(half - 6, -half - 8, 5, 9)
    ctx.fillStyle = a.body
    ctx.fillRect(-half + 2, -half - 7, 3, 8)
    ctx.fillRect(half - 5, -half - 7, 3, 8)
    ctx.fillStyle = a.earIn
    ctx.fillRect(-half + 3, -half - 6, 1, 5)
    ctx.fillRect(half - 4, -half - 6, 1, 5)
    return
  }
  const h = a.ear === 'pointy' ? 5 : a.ear === 'floppy' ? 4 : 4
  const w = a.ear === 'floppy' ? 6 : 5
  ctx.fillStyle = '#241a3d'
  ctx.fillRect(-half, -half - h, w, h + 2)
  ctx.fillRect(half - w, -half - h, w, h + 2)
  ctx.fillStyle = a.bodyDark
  ctx.fillRect(-half + 1, -half - h + 1, w - 2, h)
  ctx.fillRect(half - w + 1, -half - h + 1, w - 2, h)
  ctx.fillStyle = a.earIn
  ctx.fillRect(-half + 2, -half - h + 2, w - 4, h - 2)
  ctx.fillRect(half - w + 2, -half - h + 2, w - 4, h - 2)
}

function drawPet(ctx, x, y, r, animal, dir, t, scale = 1, chomp = false, moving = false) {
  const a = animal || getAnimal()
  const half = Math.max(6, Math.min(8, Math.round(r * scale * 0.86)))
  const size = half * 2
  const fx = dir?.x || 0
  const fy = dir?.y || 0
  const ang = Math.atan2(fy, fx || 1)
  const open = chomp ? chompOpen(t) : 0

  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))

  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fillRect(-half + 1, -half + 2, size, size)

  drawPetEars(ctx, a, half)

  ctx.save()
  roundedBox(ctx, -half, -half, size, size, 3)
  if (open > 0.04) {
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, half * 2.4, ang - open, ang + open)
    ctx.closePath()
  }
  ctx.clip('evenodd')

  ctx.fillStyle = '#241a3d'
  roundedBox(ctx, -half - 1, -half - 1, size + 2, size + 2, 4)
  ctx.fill()
  ctx.fillStyle = a.body
  roundedBox(ctx, -half, -half, size, size, 3)
  ctx.fill()
  ctx.fillStyle = a.bodyDark
  ctx.globalAlpha = 0.28
  ctx.fillRect(-half + size * 0.45, -half + size * 0.45, size * 0.55, size * 0.55)
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(-half + 1, -half + 1, size - 2, 2)
  ctx.fillRect(-half + 1, -half + 1, 2, size - 4)
  ctx.fillStyle = a.belly
  roundedBox(ctx, -half + 3, 1, size - 6, half - 1, 2)
  ctx.fill()
  ctx.fillStyle = a.cheek
  ctx.globalAlpha = 0.8
  ctx.fillRect(-half + 2, 2, 3, 2)
  ctx.fillRect(half - 5, 2, 3, 2)
  ctx.globalAlpha = 1
  ctx.restore()

  if (open > 0.04) {
    ctx.fillStyle = '#14081f'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, half + 0.2, ang - open, ang + open)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = a.bodyShade
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, half - 0.6, ang - open, ang + open)
    ctx.closePath()
    ctx.stroke()
  }

  const back = 2.4 + open * 1.6
  const midX = -Math.cos(ang) * back
  const midY = -Math.sin(ang) * (Math.abs(fx) > Math.abs(fy) ? 0.4 : back) - (Math.abs(fx) >= Math.abs(fy) ? 2.6 : 0)
  const gap = 3.2
  const eyes = [
    [midX - gap, midY],
    [midX + gap, midY],
  ]
  for (const [ex, ey] of eyes) {
    ctx.fillStyle = '#241a3d'
    ctx.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3)
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 1, 1)
  }

  drawAccessory(ctx, a.accessory, half)
  ctx.restore()
}

function drawGhost(ctx, g, fright, t) {
  const x = g.x * CELL + CELL / 2
  const y = g.y * CELL + CELL / 2
  if (g.eaten) {
    drawEyes(ctx, x, y, g.dir, true)
    return
  }
  const flashing = fright > 0 && fright < 1.6 && Math.floor(t * 8) % 2 === 0
  const r = 8.2
  ctx.fillStyle = fright > 0 ? (flashing ? '#f4e9ff' : '#3d5cff') : g.color
  ctx.beginPath()
  ctx.arc(x, y - 1.2, r, Math.PI, 0)
  ctx.lineTo(x + r, y + r * 0.85)
  for (let i = 3; i >= 0; i -= 1) {
    const wx = x - r + (2 * r * i) / 3
    const wy = y + r * 0.85 + ((i % 2 === 0) ? -2.1 : 2.1)
    ctx.lineTo(wx, wy)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.ellipse(x - 2, y - 3, 3.2, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
  if (fright > 0) {
    ctx.fillStyle = flashing ? '#241a3d' : '#fff'
    ctx.fillRect(x - 4, y - 1, 2.2, 2.2)
    ctx.fillRect(x + 1.8, y - 1, 2.2, 2.2)
    ctx.fillStyle = flashing ? '#241a3d' : '#ffb3de'
    ctx.fillRect(x - 3.4, y + 3.2, 6.8, 1.4)
  } else {
    drawEyes(ctx, x, y - 0.6, g.dir, false)
  }
}

function drawEyes(ctx, x, y, dir, eyesOnly) {
  const ox = (dir?.x || 0) * 1.4
  const oy = (dir?.y || 0) * 1.2
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.ellipse(x - 3.1, y - 1, 2.5, 2.8, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(x + 3.1, y - 1, 2.5, 2.8, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = eyesOnly ? '#4be0e0' : '#2a1460'
  ctx.beginPath(); ctx.arc(x - 3.1 + ox, y - 1 + oy, 1.25, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + 3.1 + ox, y - 1 + oy, 1.25, 0, Math.PI * 2); ctx.fill()
}
