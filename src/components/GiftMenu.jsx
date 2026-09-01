import { GIFTS } from '../utils/social'

export default function GiftMenu({ partner, onGift, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal panel panel-glow" onClick={(e) => e.stopPropagation()}>
        <div className="title-pixel">send {partner}'s pet a gift</div>
        <div className="gift-grid">
          {GIFTS.map((g) => (
            <button
              key={g.id}
              className="gift-card"
              onClick={() => { onGift(g); onClose() }}
            >
              <span className="gift-emoji" aria-hidden>{g.emoji}</span>
              <span className="tiny">{g.label}</span>
            </button>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: 14, width: '100%' }}>
          maybe later
        </button>
      </div>
    </div>
  )
}
