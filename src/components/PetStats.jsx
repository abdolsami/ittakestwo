import { XP_PER_LEVEL } from '../utils/rewards'

const SEGMENTS = 10

function StatBar({ label, icon, value, kind }) {
  const filled = Math.round((value / 100) * SEGMENTS)
  return (
    <div className={`stat-row stat-${kind}`}>
      <span className="stat-label"><span aria-hidden>{icon}</span> {label}</span>
      <div className="bar">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span key={i} className={`bar-seg ${i < filled ? 'on' : ''}`} />
        ))}
      </div>
      <span className="stat-value">{Math.round(value)}</span>
    </div>
  )
}

export default function PetStats({ pet, coinPop }) {
  const xpPct = Math.min(100, (pet.xp / XP_PER_LEVEL) * 100)

  return (
    <div>
      <div className="stats">
        <StatBar label="hunger" icon="🍖" value={pet.hunger} kind="hunger" />
        <StatBar label="happiness" icon="😊" value={pet.happiness} kind="happiness" />
        <StatBar label="energy" icon="⚡" value={pet.energy} kind="energy" />
        <StatBar label="health" icon="✚" value={pet.health} kind="health" />
      </div>

      <div className="xp-wrap">
        <div className="tiny muted" style={{ marginBottom: 6 }}>
          xp {pet.xp} / {XP_PER_LEVEL}
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="chips">
        <span className="chip chip-level">lvl {pet.level}</span>
        <span className="chip chip-xp">{pet.xp} xp</span>
        <span className={`chip chip-coins ${coinPop ? 'pop' : ''}`}>◈ {pet.coins} coins</span>
        <span className="chip chip-games">{pet.gamesPlayed} games</span>
      </div>
    </div>
  )
}
