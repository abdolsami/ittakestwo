import { XP_PER_LEVEL } from '../utils/rewards'

export default function StatsScreen({ pet, days, onReset, identity = 'you' }) {
  const cells = [
    { k: 'level', v: pet.level },
    { k: 'total xp', v: pet.level * XP_PER_LEVEL - XP_PER_LEVEL + pet.xp },
    { k: 'coins', v: pet.coins },
    { k: 'games played', v: pet.gamesPlayed },
    { k: 'days alive', v: days },
    { k: 'wordle best', v: pet.highScores?.wordle || 0 },
    { k: 'tetris best', v: pet.highScores?.tetris || 0 },
    { k: 'snake best', v: pet.highScores?.snake || 0 },
    { k: 'flappy best', v: pet.highScores?.flappy || 0 },
  ]

  return (
    <div className="screen-enter">
      <div className="section-head">
        <span className="title-pixel">{identity}'s stats</span>
        <span className="line" />
      </div>
      <p className="hint">everything {pet.name || 'your friend'} has earned, saved forever on this little machine.</p>

      <div className="stat-grid">
        {cells.map((c) => (
          <div className="stat-cell" key={c.k}>
            <div className="k">{c.k}</div>
            <div className="v">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="panel mt-24 center">
        <p className="hint">
          your pet {pet.name || ''} has been with you for {days} {days === 1 ? 'day' : 'days'}.
          {days >= 3 ? ' thank you for taking such good care of them.' : ' keep visiting to watch them grow.'}
        </p>
      </div>

      <div className="center mt-24">
        <button className="btn btn-purple" onClick={onReset} style={{ fontSize: 8 }}>start over</button>
        <p className="hint mt-8" style={{ fontSize: 12 }}>this begins a brand new friend for {identity}</p>
      </div>
    </div>
  )
}
