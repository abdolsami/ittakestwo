import { useCallback, useEffect, useRef, useState } from 'react'
import { usePet } from './hooks/usePet'
import { useNotify } from './components/Notification'
import { useRealtime, useWatch, usePartnerOnline } from './realtime/RealtimeContext'
import { publishPet, emitEvent, addFriendship } from './realtime/world'
import { useNewEvents, useWorldMaintenance } from './hooks/useWorldEvents'
import { desktopNotify, useNotifyPermission } from './hooks/useDesktopNotify'
import { giftById, SPECIAL_MOMENTS } from './utils/social'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Home from './components/Home'
import ArcadeMenu from './components/ArcadeMenu'
import FeedMenu from './components/FeedMenu'
import StatsScreen from './components/StatsScreen'
import AnimalPicker from './components/AnimalPicker'
import PetPage from './components/PetPage'
import PetPark from './components/PetPark'
import FloatingChat from './components/FloatingChat'
import Wordle from './games/Wordle'
import Tetris from './games/Tetris'
import Snake from './games/Snake'
import FlappyBird from './games/FlappyBird'

const PET_MESSAGES = [
  'your pet seems happy to see you',
  'that made your pet happy',
  'your pet seems to like that',
]

// little messages sent when you "bug" your partner to come play.
const NUDGE_MESSAGES = [
  'get on the game! 🎮',
  'come play with me!',
  "i'm online — come here!",
  "let's play a game together!",
  'the pets miss each other, come on!',
]

const gameEmoji = (g) => (
  g === 'snake' ? '🐍' : g === 'tetris' ? '🧱' : g === 'flappy' ? '🐤' : '🔤'
)

export default function World({ identity, onLogout }) {
  const rt = useRealtime()
  const partner = rt.partner
  const notify = useNotify()

  const {
    pet, mood, days, setName, setSpecies, applyReward, recordGame, feed, petThePet, resetPet,
  } = usePet(identity)

  const partnerOnline = usePartnerOnline()
  const notifyPerm = useNotifyPermission()
  const partnerPet = useWatch(`pets/${partner}`)
  const friendship = useWatch('friendship', 0)

  const [tab, setTab] = useState('home')
  const [activeGame, setActiveGame] = useState(null)
  const [coinPop, setCoinPop] = useState(false)
  const [levelUp, setLevelUp] = useState(null)
  const [feeding, setFeeding] = useState(false)
  const [petting, setPetting] = useState(false)

  // publish a public snapshot of my pet whenever it meaningfully changes.
  useEffect(() => {
    if (!pet.species) return
    publishPet(rt, pet, mood)
  }, [rt, pet.species, pet.name, pet.level, pet.hunger, pet.happiness, pet.energy, pet.health, mood, pet])

  // react to interaction events coming from the world.
  useNewEvents((e) => {
    const mine = e.from === identity
    if (e.type === 'gift') {
      if (e.to === identity) {
        const g = giftById(e.item)
        applyReward({ hunger: g.hunger, happiness: g.happiness })
        notify(`${e.from} gave your pet a ${g.label} ${g.emoji}`, g.emoji)
      }
    } else if (e.type === 'hi') {
      if (!mine) notify(`${e.from}'s pet said hi to your pet!`, '👋')
    } else if (e.type === 'activity') {
      if (!mine) {
        const m = e.act === 'sit' ? 'your pets are sitting together 🪑'
          : e.act === 'sleep' ? 'your pets are napping together 💤'
            : 'your pets are playing together 🎾'
        notify(m, '😊')
      }
    } else if (e.type === 'celebrate') {
      if (!mine) notify(`${e.from} played ${e.game}! nice game 🎉`, '🎉')
    } else if (e.type === 'special') {
      notify(e.text, '✨')
    } else if (e.type === 'nudge') {
      if (e.to === identity) {
        notify(`${e.from}: ${e.text}`, '🔔')
        desktopNotify(`${e.from} is calling you!`, { body: e.text, tag: 'nudge', force: true })
      }
    }
  })

  const triggerCoinPop = useCallback(() => {
    setCoinPop(true)
    setTimeout(() => setCoinPop(false), 500)
  }, [])

  const handleReward = useCallback((reward) => {
    const res = applyReward(reward)
    triggerCoinPop()
    if (res.leveledUp) {
      setLevelUp({ level: res.newLevel, bonus: res.coinBonus })
      setTimeout(() => setLevelUp(null), 1800)
      setTimeout(() => notify('your pet leveled up!', '🎉'), 300)
    }
    return res
  }, [applyReward, triggerCoinPop, notify])

  const startGame = useCallback((game) => {
    setActiveGame(game)
  }, [])

  const onGameFinish = useCallback((game) => (reward, score, isHigh) => {
    recordGame(game, score)
    handleReward(reward)
    notify(reward.message, gameEmoji(game))
    if (isHigh && score > 0) {
      setTimeout(() => notify('new high score!', '🏆'), 400)
    }
    emitEvent(rt, { type: 'celebrate', game, score })
    addFriendship(rt, 'game')
  }, [recordGame, handleReward, notify, rt])

  const handleFeed = useCallback((item, message) => {
    const ok = feed(item)
    if (!ok) { notify('not enough coins for that', '◈'); return }
    setFeeding(true)
    setTimeout(() => setFeeding(false), 1400)
    notify(message || 'yum', item.emoji)
    triggerCoinPop()
  }, [feed, notify, triggerCoinPop])

  const handlePet = useCallback(() => {
    petThePet()
    setPetting(true)
    setTimeout(() => setPetting(false), 900)
    notify(PET_MESSAGES[Math.floor(Math.random() * PET_MESSAGES.length)], '😊')
  }, [petThePet, notify])

  const handleReset = useCallback(() => {
    resetPet()
    setTab('home')
    setActiveGame(null)
    notify('a new friend is on the way', '🥚')
  }, [resetPet, notify])

  // interactions from the pet page.
  const handleWave = useCallback(() => {
    emitEvent(rt, { type: 'hi' })
    addFriendship(rt, 'hi')
    notify(`your pet waved at ${partner}'s pet!`, '👋')
  }, [rt, partner, notify])

  const handleGift = useCallback((g) => {
    emitEvent(rt, { type: 'gift', to: partner, item: g.id })
    addFriendship(rt, 'gift')
    notify(`you gave ${partner}'s pet a ${g.label} ${g.emoji}`, g.emoji)
  }, [rt, partner, notify])

  // "bug" your partner: send them a message + a desktop notification telling
  // them to come play. throttled so it can't be spammed.
  const nudgeAt = useRef(0)
  const handleNudge = useCallback(() => {
    // first bug also asks to turn on this person's own alerts.
    if (notifyPerm.supported && notifyPerm.permission === 'default') notifyPerm.request()
    const now = Date.now()
    if (now - nudgeAt.current < 8000) {
      notify(`wait a sec before bugging ${partner} again`, '⏳')
      return
    }
    nudgeAt.current = now
    const text = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]
    emitEvent(rt, { type: 'nudge', to: partner, text })
    notify(`you bugged ${partner} to come play 🔔`, '🔔')
  }, [rt, partner, notify, notifyPerm])

  // welcome note once per load.
  const [welcomed, setWelcomed] = useState(false)
  useEffect(() => {
    if (pet.species && !welcomed) {
      setWelcomed(true)
      const t = setTimeout(() => notify(`welcome back, ${identity}`, '🎮'), 600)
      return () => clearTimeout(t)
    }
    return undefined
  }, [pet.species, welcomed, notify, identity])

  // rare shared special moments while both are online (mehreenz emits to avoid dupes).
  useEffect(() => {
    if (!partnerOnline || identity !== 'mehreenz') return undefined
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        const m = SPECIAL_MOMENTS[Math.floor(Math.random() * SPECIAL_MOMENTS.length)]
        emitEvent(rt, { type: 'special', id: m.id, text: m.text })
      }
    }, 60000)
    return () => clearInterval(id)
  }, [partnerOnline, identity, rt])

  // ---- onboarding: pick your animal ----
  if (!pet.species) {
    return (
      <AnimalPicker identity={identity} onPick={(species, label) => {
        setSpecies(species, label)
        setTab('home')
        setTimeout(() => notify(`say hi to your new ${label}!`, '😊'), 400)
      }} />
    )
  }

  // ---- a game running full-screen (wider, with a docked chat panel) ----
  if (activeGame) {
    const exit = () => setActiveGame(null)
    return (
      <div className="app app-game">
        <Header
          identity={identity} partner={partner} partnerOnline={partnerOnline}
          coins={pet.coins} coinPop={coinPop} onLogout={onLogout}
          onNudge={handleNudge}
          notifPermission={notifyPerm.permission} notifSupported={notifyPerm.supported}
          onEnableNotify={notifyPerm.request}
        />
        <div className="game-layout">
          <main className="game-main">
            {activeGame === 'wordle' && (
              <Wordle onExit={exit} onFinish={onGameFinish('wordle')} highScore={pet.highScores?.wordle || 0} />
            )}
            {activeGame === 'tetris' && (
              <Tetris onExit={exit} onFinish={onGameFinish('tetris')} highScore={pet.highScores?.tetris || 0} />
            )}
            {activeGame === 'snake' && (
              <Snake onExit={exit} onFinish={onGameFinish('snake')} highScore={pet.highScores?.snake || 0} />
            )}
            {activeGame === 'flappy' && (
              <FlappyBird onExit={exit} onFinish={onGameFinish('flappy')} highScore={pet.highScores?.flappy || 0} mySpecies={pet.species} />
            )}
          </main>
          <aside className="game-side">
            <FloatingChat identity={identity} partner={partner} partnerOnline={partnerOnline} docked />
          </aside>
        </div>
        {levelUp && <LevelUpBurst level={levelUp.level} />}
        <Navigation
          active={tab === 'feed' ? 'pet' : tab}
          onChange={(t) => { setActiveGame(null); setTab(t) }}
        />
        <WorldMaintenance />
      </div>
    )
  }

  // ---- every tab: full-width main stretched left, chat docked on the right ----
  // (the dedicated chat tab shows the chat panel on its own, full width.)
  return (
    <div className="app app-game">
      <Header
        identity={identity} partner={partner} partnerOnline={partnerOnline}
        coins={pet.coins} coinPop={coinPop} onLogout={onLogout}
        onNudge={handleNudge}
        notifPermission={notifyPerm.permission} notifSupported={notifyPerm.supported}
        onEnableNotify={notifyPerm.request}
      />

      {tab === 'chat' ? (
        <div className="screen screen-chat" key="chat">
          <FloatingChat identity={identity} partner={partner} partnerOnline={partnerOnline} docked />
        </div>
      ) : (
        <div className="game-layout page-layout" key={tab}>
          <main className="game-main page-main">
            {tab === 'home' && (
              <Home
                pet={pet} mood={mood} coinPop={coinPop} feeding={feeding} petting={petting}
                partnerPet={partnerPet} partnerOnline={partnerOnline} friendship={friendship}
                identity={identity} partner={partner}
                onPlay={() => setTab('games')}
                onFeed={() => setTab('feed')}
                onPet={handlePet}
                onVisitPark={() => setTab('park')}
              />
            )}
            {tab === 'games' && <ArcadeMenu pet={pet} identity={identity} partner={partner} partnerOnline={partnerOnline} onSelect={startGame} />}
            {tab === 'feed' && <FeedMenu pet={pet} onFeed={handleFeed} />}
            {tab === 'park' && (
              <PetPark
                identity={identity} partner={partner}
                myPet={{ species: pet.species, name: pet.name, mood }}
                partnerPet={partnerPet} friendship={friendship}
                partnerOnline={partnerOnline} notify={notify}
              />
            )}
            {tab === 'pet' && (
              <PetPage
                identity={identity} pet={pet} mood={mood} feeding={feeding} petting={petting}
                partner={partner} partnerPet={partnerPet} partnerOnline={partnerOnline} friendship={friendship}
                onFeed={() => setTab('feed')}
                onPet={handlePet}
                onRename={setName}
                onWave={handleWave}
                onGift={handleGift}
              />
            )}
            {tab === 'stats' && <StatsScreen pet={pet} days={days} identity={identity} onReset={handleReset} />}
          </main>
          <aside className="game-side menu">
            <FloatingChat identity={identity} partner={partner} partnerOnline={partnerOnline} docked />
          </aside>
        </div>
      )}

      <Navigation
        active={tab === 'feed' ? 'pet' : tab}
        onChange={(t) => { setActiveGame(null); setTab(t) }}
      />

      {levelUp && <LevelUpBurst level={levelUp.level} />}
      <WorldMaintenance />
    </div>
  )
}

// invisible helper: prunes old chat/events so the shared world stays tidy.
// isolated in its own component so its data subscriptions don't re-render World.
function WorldMaintenance() {
  useWorldMaintenance()
  return null
}

function LevelUpBurst({ level }) {
  return (
    <div className="levelup">
      <div className="lu-text">you made it<br />to level {level}!<br /><span style={{ fontSize: 12 }}>your pet leveled up</span></div>
    </div>
  )
}
