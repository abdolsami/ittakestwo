import { useState } from 'react'
import Pet from './Pet'
import { AccessoryBoard, ColorBoard } from './LookStudio'
import { ANIMAL_KEYS, ANIMALS } from '../utils/animals'
import { DEFAULT_ACCESSORY } from '../utils/appearance'

export default function AnimalPicker({ onPick, identity = 'friend' }) {
  const [step, setStep] = useState('animal')
  const [selected, setSelected] = useState(null)
  const [color, setColor] = useState(null)
  const [accessory, setAccessory] = useState(DEFAULT_ACCESSORY)

  const animal = selected ? ANIMALS[selected] : null
  const bodyColor = color || animal?.body

  const pickAnimal = (key) => {
    setSelected(key)
    setColor(ANIMALS[key].body)
    setAccessory(DEFAULT_ACCESSORY)
  }

  const confirm = () => {
    if (!selected) return
    onPick(selected, ANIMALS[selected].label, { color: bodyColor, accessory })
  }

  return (
    <div className="app">
      <div className="screen picker-screen">
        <div className="screen-enter stack">
          <div className="center">
            <div className="greeting">welcome, {identity}</div>
            <div className="submessage">
              {step === 'animal' && 'which animal do you want as your pet?'}
              {step === 'color' && 'pick any color you want'}
              {step === 'accessory' && 'now give them an accessory'}
            </div>
          </div>

          {step === 'animal' && (
            <>
              <div className="picker-grid">
                {ANIMAL_KEYS.map((key) => {
                  const a = ANIMALS[key]
                  const isOn = selected === key
                  return (
                    <button
                      key={key}
                      className={`picker-card ${isOn ? 'picker-card-on' : ''}`}
                      onClick={() => pickAnimal(key)}
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
                onClick={() => setStep('color')}
                disabled={!selected}
              >
                {selected ? `next · color ${animal.label}` : 'tap an animal'}
              </button>
            </>
          )}

          {step !== 'animal' && selected && (
            <div className="picker-preview panel">
              <Pet
                mood="excited"
                species={selected}
                color={bodyColor}
                accessory={accessory}
              />
              <div className="picker-name" style={{ marginTop: 8 }}>
                {animal.emoji} {animal.label}
                {accessory !== 'none' ? ` · ${accessory}` : ''}
              </div>
            </div>
          )}

          {step === 'color' && (
            <>
              <ColorBoard value={bodyColor} fallback={animal.body} onChange={setColor} />
              <div className="picker-nav">
                <button className="btn btn-purple" onClick={() => setStep('animal')}>back</button>
                <button className="btn btn-pink btn-glow" onClick={() => setStep('accessory')}>next · accessory</button>
              </div>
            </>
          )}

          {step === 'accessory' && (
            <>
              <AccessoryBoard value={accessory} onChange={setAccessory} />
              <div className="picker-nav">
                <button className="btn btn-purple" onClick={() => setStep('color')}>back</button>
                <button className="btn btn-pink btn-glow" onClick={confirm}>
                  say hi to your {animal.label}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
