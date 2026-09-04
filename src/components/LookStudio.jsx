import { ACCESSORIES, COLOR_PRESETS, normalizeHex } from '../utils/appearance'

export function ColorBoard({ value, fallback, onChange }) {
  const current = normalizeHex(value) || normalizeHex(fallback) || '#f7c873'
  return (
    <div className="look-board">
      <div className="look-swatches">
        {COLOR_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            className={`look-swatch ${current === hex ? 'look-swatch-on' : ''}`}
            style={{ background: hex }}
            aria-label={hex}
            onClick={() => onChange(hex)}
          />
        ))}
        <label className="look-swatch look-any" title="any color">
          <input
            type="color"
            value={current}
            onChange={(e) => onChange(e.target.value)}
            aria-label="pick any color"
          />
          <span>any</span>
        </label>
      </div>
    </div>
  )
}

export function AccessoryBoard({ value, onChange }) {
  return (
    <div className="look-board">
      <div className="acc-grid">
        {ACCESSORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`acc-card ${value === item.id ? 'acc-card-on' : ''}`}
            onClick={() => onChange(item.id)}
          >
            <span className="acc-emoji" aria-hidden>{item.emoji}</span>
            <span className="acc-name">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
