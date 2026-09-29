import { memo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRealtime, useWatch } from '../realtime/RealtimeContext'
import { GARDEN_FLOWERS, GARDENERS, gardenBedPath, gardenBloomCount } from '../utils/town'

function TownGarden({ identity, stage, notify }) {
  const rt = useRealtime()
  const beds = useWatch('town/garden/beds')
  const [flower, setFlower] = useState('rose')
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const full = GARDENERS.every(who => gardenBloomCount(beds, who) === 3)

  const plant = async (slot) => {
    const path = gardenBedPath(identity, slot)
    if (!path || busy.current || beds?.[identity]?.[slot] === flower) return
    busy.current = true
    setSaving(true)
    try {
      // Each bed is its own write: planting together cannot replace a friend's work.
      await rt.set(path, flower)
      notify(`a ${flower} flower for your shared garden`, '🌷')
    } catch {
      notify('could not save your flower. please try again.', '🌱')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return <>
    {stage && createPortal(<>
      <div className={`garden-beds ${full ? 'garden-in-bloom' : ''}`} aria-label="shared flower beds">
        {GARDENERS.flatMap(who => [0,1,2].map(slot => {
          const saved = beds?.[who]?.[slot]
          const color = Object.hasOwn(GARDEN_FLOWERS, saved) ? GARDEN_FLOWERS[saved] : null
          return <button key={`${who}-${slot}`} className="garden-bed" disabled={who !== identity || saving}
            onClick={() => plant(slot)} aria-label={`${who}'s bed ${slot+1}: ${color ? saved : 'empty'}${who === identity ? `; plant ${flower}` : ''}`}>
            <svg viewBox="0 0 70 70" aria-hidden="true"><path d="M3 48H67V65H3Z" fill="#795b78" stroke="#201332" strokeWidth="3"/><path d="M8 52H62V58H8Z" fill="#493647"/>
              {color ? <><path d="M35 53V24M35 43L22 34M35 39L49 30" stroke="#85cf9e" strokeWidth="5"/><path d="M25 7H45V15H53V31H45V39H25V31H17V15H25Z" fill={color} stroke="#201332" strokeWidth="3"/><rect x="30" y="18" width="10" height="10" fill="#fff0bf"/></> : <path d="M35 46V29M26 37H44" stroke="#bca4bb" strokeWidth="3"/>}
            </svg>
            <span>{who === identity ? 'yours' : who}</span>
          </button>
        }))}
      </div>
      {full && <div className="garden-fireflies" aria-hidden="true">{[0,1,2,3,4,5].map(i => <i key={i} style={{ left: `${18+i*13}%`, top: `${26+i%3*12}%`, animationDelay: `${i*.45}s` }}/>)}</div>}
    </>, stage)}
    <section className="town-garden-panel panel" aria-label="community garden">
      <div><span className="tiny muted">a two-pet project</span><h3 className="title-pixel">{full ? 'our garden is glowing!' : 'grow a little world together'}</h3>
        <p>Choose a flower, then tap one of your three beds. Replant freely. Fill both sides to invite the fireflies.</p></div>
      <div className="garden-seeds" role="group" aria-label="choose a flower">{Object.entries(GARDEN_FLOWERS).map(([id,color]) => <button key={id} className="garden-seed" aria-pressed={flower === id} onClick={() => setFlower(id)}><i style={{background:color}}/>{id}</button>)}</div>
      <p className="tiny" aria-live="polite">{saving ? 'planting…' : GARDENERS.map(who => `${who} ${gardenBloomCount(beds, who)}/3`).join(' · ')}</p>
    </section>
  </>
}

export default memo(TownGarden)
