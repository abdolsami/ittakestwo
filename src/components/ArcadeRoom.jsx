import { memo } from 'react'

const MACHINES = [
  { id: 'wordle', title: 'Word club', subtitle: 'Crack it together', color: '#87efa3', glyph: 'ABC' },
  { id: 'tetris', title: 'Block party', subtitle: 'Two players. One well.', color: '#7debf1', glyph: '▟' },
  { id: 'pacman', title: 'Pet maze', subtitle: 'Chomp with your pet', color: '#ffe28b', glyph: '●' },
  { id: 'snake', title: 'Neon trails', subtitle: 'Try not to cross paths', color: '#caa5ff', glyph: '⌁' },
  { id: 'flappy', title: 'Sky hop', subtitle: 'A little leap of faith', color: '#ffa1c5', glyph: '↗' },
]

function ArcadeRoom() {
  return <>
    <div className="arcade-back-wall" aria-hidden="true"><span className="arcade-wall-star">✦</span><span className="arcade-neon-sign">starlight<span>good games. better company.</span></span><span className="arcade-wall-star">✦</span></div>
    <div className="arcade-floor" aria-hidden="true"/>
    <div className="arcade-ceiling-lights" aria-hidden="true"><i/><i/><i/><i/><i/></div>
    <div className="arcade-wall-trim" aria-hidden="true"/>
    <div className="room-machines" aria-hidden="true">{MACHINES.map(machine => <div key={machine.id} className="room-machine" style={{ '--machine-color': machine.color }}>
      <span className="machine-marquee">{machine.title}</span>
      <span className={`machine-display machine-${machine.id}`}><b>{machine.glyph}</b><small>1P / 2P</small></span>
      <span className="machine-console"><i/><em/><em/></span><span className="machine-base"><i/></span>
      <span className="machine-caption">{machine.subtitle}</span>
    </div>)}</div>
    <div className="arcade-floor-badge" aria-hidden="true">✦ player one + player two ✦</div>
    <div className="arcade-lounge" aria-hidden="true"><div className="arcade-bench"/><div className="arcade-token-box"><b>◈</b><small>good luck!</small></div><div className="arcade-bench"/></div>
  </>
}

export default memo(ArcadeRoom)
