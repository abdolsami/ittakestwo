import { friendshipLevel, friendshipProgress, FRIENDSHIP } from '../utils/social'

const CAPTIONS = {
  1: 'just met — say hi to get closer',
  2: 'warming up — you can play together',
  3: 'good friends — you can sit together',
  4: 'close friends — you can trade gifts',
  5: 'best friends forever!',
}

export function friendshipCaption(level) {
  return CAPTIONS[level] || CAPTIONS[1]
}

export function FriendshipStars({ points, size = 'md' }) {
  const level = friendshipLevel(points)
  return (
    <span className={`starbar ${size === 'sm' ? 'starbar-sm' : ''}`} aria-label={`friendship level ${level} of ${FRIENDSHIP.maxLevel}`}>
      {Array.from({ length: FRIENDSHIP.maxLevel }).map((_, i) => (
        <span key={i} className={`starbar-pip ${i < level ? 'on' : ''}`}>{i < level ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

export function FriendshipBar({ points }) {
  const level = friendshipLevel(points)
  const pct = level >= FRIENDSHIP.maxLevel ? 100 : friendshipProgress(points)
  return (
    <div className="friendship">
      <div className="friendship-head">
        <span className="title-pixel">pet friendship</span>
        <FriendshipStars points={points} />
      </div>
      <div className="xp-track">
        <div className="friendship-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>{friendshipCaption(level)}</p>
    </div>
  )
}
