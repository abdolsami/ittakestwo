import { useEffect, useRef, useState } from 'react'
import { useRealtime } from '../realtime/RealtimeContext'
import { sendChat } from '../realtime/world'
import { useChat } from '../hooks/useWorldEvents'
import { desktopNotify } from '../hooks/useDesktopNotify'

const QUICK = ['hi!', 'come to the park!', 'play a game?', 'good night!']

export default function FloatingChat({ identity, partner, partnerOnline, docked = false }) {
  const rt = useRealtime()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const messages = useChat(60)
  const listRef = useRef(null)
  const lastSeen = useRef(Date.now())
  const [unseen, setUnseen] = useState(0)
  const mountTs = useRef(Date.now())
  const notifiedTs = useRef(0)

  // when docked (inside the game view) the panel is always visible.
  const panelOpen = docked || open

  // pop a desktop notification when a new message arrives from my partner
  // (only fires if they've allowed alerts; only for messages after mount).
  useEffect(() => {
    const fresh = messages.filter(
      (m) => m.from === partner && m.ts > mountTs.current && m.ts > notifiedTs.current,
    )
    if (fresh.length === 0) return
    const last = fresh[fresh.length - 1]
    notifiedTs.current = last.ts
    desktopNotify(`${partner} messaged you`, { body: last.text, tag: 'chat' })
  }, [messages, partner])

  useEffect(() => {
    if (panelOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, panelOpen])

  useEffect(() => {
    if (panelOpen) {
      lastSeen.current = Date.now()
      setUnseen(0)
      return
    }
    setUnseen(messages.filter((m) => m.from === partner && m.ts > lastSeen.current).length)
  }, [messages, panelOpen, partner])

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    sendChat(rt, t)
    setText('')
  }

  const panel = (
    <div className={`chat-panel ${docked ? 'docked' : ''}`}>
      <div className="chat-head">
        <span className="title-pixel">chat</span>
        <span className={`presence-badge ${partnerOnline ? 'on' : ''}`}>
          <span className="presence-dot" aria-hidden />
          {partner} {partnerOnline ? 'online' : 'away'}
        </span>
      </div>

      <div className="chat-log" ref={listRef}>
        {messages.length === 0 && (
          <p className="tiny muted center" style={{ padding: '20px 0' }}>
            say something to {partner}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.from === identity ? 'mine' : 'theirs'}`}>
            <span className="chat-from">{m.from}</span>
            <span className="chat-bubble">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-quick">
        {QUICK.map((q) => (
          <button key={q} className="quick-chip" onClick={() => sendChat(rt, q)}>{q}</button>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`message ${partner}...`}
          maxLength={300}
        />
        <button className="btn btn-pink" type="submit">send</button>
      </form>
    </div>
  )

  // docked: a permanent side panel (used inside the game view).
  if (docked) return panel

  // floating: a bubble button that opens the panel (used on all other pages).
  return (
    <>
      <button
        className={`chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="chat"
      >
        {open ? '✕' : (
          <>
            <span className="chat-fab-ico" aria-hidden>💬</span>
            <span className="chat-fab-label">chat</span>
          </>
        )}
        {!open && unseen > 0 && <span className="chat-dot">{unseen}</span>}
      </button>

      {open && panel}
    </>
  )
}
