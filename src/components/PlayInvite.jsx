export default function PlayInvite({ game, partner, onTogether, onSolo }) {
  return (
    <div className="game-over-card">
      <div className="go-title">play together?</div>
      <div className="go-msg">
        {partner} is already playing {game}.<br />
        want to play with them?
      </div>
      <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <button className="btn btn-green" onClick={onTogether}>yes — with {partner}</button>
        <button className="btn btn-purple" onClick={onSolo}>no — solo</button>
      </div>
    </div>
  )
}
