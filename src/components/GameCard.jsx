export default function GameCard({ title, desc, emoji, highScore, topColor, btnClass, onPlay }) {
  return (
    <div className="cabinet">
      <div className="cabinet-top" style={{ background: topColor }} />
      <div className="cab-screen">
        <span className="cab-emoji" aria-hidden>{emoji}</span>
        <div className="cab-title" style={{ color: topColor }}>{title}</div>
        <div className="cab-desc">{desc}</div>
      </div>
      <div className="cab-high">high score: {highScore}</div>
      <button className={`btn ${btnClass} btn-glow`} style={{ width: '100%' }} onClick={onPlay}>
        [ play ]
      </button>
    </div>
  )
}
