import GameCard from './GameCard'

export default function ArcadeMenu({ pet, onSelect, identity = 'you', partner, partnerOnline }) {
  return (
    <div className="screen-enter">
      <div className="section-head">
        <span className="title-pixel">the arcade</span>
        <span className="line" />
      </div>
      <p className="hint">pick a machine, {identity}. every game you play helps take care of your pet.</p>

      {partner && (
        <p className={`versus-note ${partnerOnline ? 'on' : ''}`}>
          {partnerOnline
            ? `${partner} is online — flappy & wordle are two-player! tetris and snake race head-to-head.`
            : `${partner} is away — play solo, or wait for them to play together.`}
        </p>
      )}

      <div className="cabinets">
        <GameCard
          title="wordle"
          desc="co-op · solve together"
          emoji="🔤"
          highScore={pet.highScores?.wordle || 0}
          topColor="var(--green-2)"
          btnClass="btn-green"
          onPlay={() => onSelect('wordle')}
        />
        <GameCard
          title="tetris"
          desc="clear the lines"
          emoji="🧱"
          highScore={pet.highScores?.tetris || 0}
          topColor="var(--cyan)"
          btnClass="btn-cyan"
          onPlay={() => onSelect('tetris')}
        />
        <GameCard
          title="snake"
          desc="grow as long as you can"
          emoji="🐍"
          highScore={pet.highScores?.snake || 0}
          topColor="var(--yellow)"
          btnClass="btn-yellow"
          onPlay={() => onSelect('snake')}
        />
        <GameCard
          title="flappy"
          desc="two-player · same sky"
          emoji="🐤"
          highScore={pet.highScores?.flappy || 0}
          topColor="var(--pink)"
          btnClass="btn-pink"
          onPlay={() => onSelect('flappy')}
        />
      </div>

      <p className="hint center mt-24">{identity}'s high scores live here forever ✨</p>
    </div>
  )
}
