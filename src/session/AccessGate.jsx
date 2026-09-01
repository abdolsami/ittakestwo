import { useState } from 'react'
import { isFirebaseConfigured } from '../realtime/config'

// rotating welcome lines — a different one shows each time a new session starts.
const GREETINGS = [
  "welcome to mehrali's world",
  "welcome back to mehrali's world",
  "step into mehrali's world",
  "mehrali's world missed you",
  "good to see you in mehrali's world",
  "you're back in mehrali's world",
  "hey! this is mehrali's world",
]

// pick the next greeting in order and remember it, so every fresh page load
// (a new session) shows a new one. computed once when the module loads.
function nextGreeting() {
  try {
    const key = 'mehrali-greet-idx'
    const prev = Number(window.localStorage.getItem(key))
    const idx = (Number.isFinite(prev) ? prev + 1 : 0) % GREETINGS.length
    window.localStorage.setItem(key, String(idx))
    return GREETINGS[idx]
  } catch {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  }
}

const SESSION_GREETING = nextGreeting()

export default function AccessGate({ onLogin }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const ok = onLogin(value)
    if (!ok) {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="gate">
      <div className="gate-inner screen-enter">
        <div className="gate-badge">🎮</div>
        <h1 className="gate-title">{SESSION_GREETING}</h1>
        <p className="gate-sub">enter your password</p>
        <form onSubmit={submit} className="gate-form">
          <input
            className={`name-input ${error ? 'input-error' : ''}`}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
            placeholder="your password"
            autoFocus
            aria-label="password"
          />
          <button className="btn btn-pink btn-glow" type="submit">enter</button>
        </form>
        {error && <p className="gate-error">try again 😠</p>}
        <p className={`gate-note ${isFirebaseConfigured() ? 'gate-note-on' : ''}`}>
          {isFirebaseConfigured()
            ? '☁ cloud sync on · synced across devices'
            : 'preview mode · syncs between tabs on this device'}
        </p>
      </div>
    </div>
  )
}
