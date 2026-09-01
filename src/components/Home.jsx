import { useEffect, useState } from 'react'
import Pet from './Pet'
import PetStats from './PetStats'
import { FriendshipBar } from './Friendship'
import { getTimeGreeting } from '../utils/timeGreeting'
import { moodFromSnapshot } from '../utils/petText'
import { friendshipLevel } from '../utils/social'

export default function Home({
  pet, mood, coinPop, feeding, petting,
  partnerPet, partnerOnline, friendship, identity, partner,
  onPlay, onFeed, onPet, onVisitPark,
}) {
  const [greeting, setGreeting] = useState(() => getTimeGreeting(''))

  useEffect(() => {
    const tick = () => setGreeting(getTimeGreeting(''))
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  const level = friendshipLevel(friendship)
  const partnerMood = moodFromSnapshot(partnerPet)
  const bothHere = Boolean(partnerPet?.species)

  return (
    <div className="screen-enter stack">
      <div className="center">
        <div className="greeting">mehreenz + ali</div>
        <div className="submessage">{greeting.trim()}</div>
      </div>

      {/* the two pets together */}
      <div className="pet-window together-window">
        <Stars />
        <Clouds />
        <div className="floor grass-floor" />
        <div className="together-stage">
          <div className="together-pet">
            <span className="together-name">{pet.name || identity}</span>
            <Pet mood={mood} species={pet.species} facing="right" />
          </div>

          <div className="together-star" aria-hidden>
            {level >= 2 ? '⭐' : '·'}
          </div>

          <div className="together-pet">
            <span className="together-name">
              {bothHere ? (partnerPet.name || partner) : `${partner}'s pet`}
            </span>
            {bothHere ? (
              <Pet mood={partnerMood} species={partnerPet.species} facing="left" />
            ) : (
              <div className="pet-empty">
                <span className="pet-empty-egg" aria-hidden>🥚</span>
                <span className="tiny muted">waiting for {partner}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="center">
        <p className="hint">
          {level >= 5 ? 'your pets are best friends!'
            : level >= 2 ? 'your pets are friends'
              : 'your pets are getting to know each other'}
        </p>
      </div>

      <div className="panel panel-glow">
        <FriendshipBar points={friendship} />
      </div>

      <button className="btn btn-pink btn-glow big-park-btn" onClick={onVisitPark}>
        🌳 visit the pet park
      </button>

      <div className="section-head">
        <span className="title-pixel">your pet</span>
        <span className="line" />
      </div>

      <div className="panel">
        <PetStats pet={pet} coinPop={coinPop} />
      </div>

      <div className="btn-row">
        <button className="btn btn-pink" onClick={onPlay}>play</button>
        <button className="btn btn-yellow" onClick={onFeed}>feed</button>
        <button className="btn btn-cyan" onClick={onPet}>pet</button>
      </div>

      <p className="hint center">
        take care of your pet, {identity} 😊
      </p>
    </div>
  )
}

function Stars() {
  const [stars] = useState(() =>
    Array.from({ length: 10 }).map(() => ({
      top: `${Math.random() * 45}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2.5}s`,
    }))
  )
  return (
    <>
      {stars.map((s, i) => (
        <span key={i} className="star" style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
      ))}
    </>
  )
}

function Clouds() {
  return (
    <>
      <span className="cloud cloud-1" aria-hidden>☁️</span>
      <span className="cloud cloud-2" aria-hidden>☁️</span>
    </>
  )
}
