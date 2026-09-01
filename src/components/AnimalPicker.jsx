import { useState } from 'react'
import Pet from './Pet'
import { ANIMAL_KEYS, ANIMALS } from '../utils/animals'

export default function AnimalPicker({ onPick, identity = 'friend' }) {
  const [selected, setSelected] = useState(null)

  const confirm = () => {
    if (!selected) return
    onPick(selected, ANIMALS[selected].label)
  }

  return (
    <div className="app">
      <div className="screen picker-screen">
        <div className="screen-enter stack">
          <div className="center">
            <div className="greeting">welcome, {identity}</div>
            <div className="submessage">which animal do you want as your pet?</div>
          </div>

          <div className="picker-grid">
            {ANIMAL_KEYS.map((key) => {
              const a = ANIMALS[key]
              const isOn = selected === key
              return (
                <button
                  key={key}
                  className={`picker-card ${isOn ? 'picker-card-on' : ''}`}
                  onClick={() => setSelected(key)}
                >
                  <div className="picker-pet">
                    <Pet mood={isOn ? 'excited' : 'happy'} species={key} />
                  </div>
                  <span className="picker-name">
                    {a.emoji} {a.label}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            className="btn btn-pink btn-glow picker-confirm"
            onClick={confirm}
            disabled={!selected}
          >
            {selected ? `pick ${ANIMALS[selected].label}` : 'tap an animal'}
          </button>
        </div>
      </div>
    </div>
  )
}
