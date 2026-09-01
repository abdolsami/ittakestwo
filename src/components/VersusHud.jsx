import { useEffect, useRef } from 'react'
import { useRealtime, useWatch, usePartnerOnline } from '../realtime/RealtimeContext'
import { setGameLive, clearGameLive } from '../realtime/world'

// a compact live scoreboard shown on top of a game. it publishes my live score
// so my partner sees it, and shows my partner's live score for the same game —
// turning every game into a friendly head-to-head when you're both playing.
export default function VersusHud({ game, myScore, myStatus }) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const partnerLive = useWatch(game ? `games/${game}/live/${partner}` : null)
  const lastPub = useRef(0)

  useEffect(() => {
    if (!game) return
    const now = Date.now()
    // always flush the final "done" state; throttle live updates a little.
    if (myStatus === 'done' || now - lastPub.current > 140) {
      lastPub.current = now
      setGameLive(rt, game, { score: myScore, status: myStatus })
    }
  }, [rt, game, myScore, myStatus])

  // remove my entry when the game closes.
  useEffect(() => () => clearGameLive(rt, game), [rt, game])

  const partnerScore = partnerLive ? (partnerLive.score ?? 0) : null
  const partnerPlaying = Boolean(partnerLive) && partnerLive.status === 'playing'
  const bothDone = myStatus === 'done' && partnerLive && partnerLive.status === 'done'

  let result = null
  if (bothDone) {
    if (myScore > partnerScore) result = 'you win!'
    else if (myScore < partnerScore) result = `${partner} wins`
    else result = 'tie!'
  }

  return (
    <div className="versus-hud">
      <div className="vs-side vs-me">
        <span className="vs-name">you</span>
        <span className="vs-score">{myScore}</span>
      </div>
      <span className={`vs-mid ${result ? 'vs-result' : ''}`}>{result || 'vs'}</span>
      <div className="vs-side vs-them">
        <span className="vs-name">
          {partner}
          {partnerPlaying && <span className="vs-live"> live</span>}
        </span>
        <span className="vs-score">
          {partnerLive ? partnerScore : (partnerOnline ? '—' : 'away')}
        </span>
      </div>
    </div>
  )
}
