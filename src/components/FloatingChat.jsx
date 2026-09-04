import { useEffect, useMemo, useRef, useState } from 'react'
import { useRealtime, useWatch } from '../realtime/RealtimeContext'
import {
  sendChat, setChatTyping, setChatDelivered, setChatSeen,
} from '../realtime/world'
import { useChat } from '../hooks/useWorldEvents'
import { desktopNotify } from '../hooks/useDesktopNotify'

const QUICK = ['hi!', 'come to the park!', 'play a game?', 'mehreen!', 'ali!']
const EMOJIS = [
  '🙄', '😚', '🥺', '😓', '🤞', '🙂', '🤬', '✌️',
  '😮', '😍', '💔', '😭', '😣', '😌', '👅', '🤔',
  '☹️', '😒', '⚡', '🥰', '😘', '💯', '❤️‍🩹', '🫡',
  '💋', '😢', '🧐', '😪', '🤷‍♂️', '🍟', '👀', '👨',
]

// how long a keystroke keeps the "typing…" bubble alive on the other screen.
const TYPING_TTL = 4000

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()

export default function FloatingChat({ identity, partner, partnerOnline, docked = false }) {
  const rt = useRealtime()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [tick, setTick] = useState(0)
  const messages = useChat(60)
  const partnerMeta = useWatch(`chatMeta/${partner}`, {})
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const lastSeen = useRef(Date.now())
  const [unseen, setUnseen] = useState(0)
  const mountTs = useRef(Date.now())
  const notifiedTs = useRef(0)
  const typingSentAt = useRef(0)
  const typingStopTimer = useRef(null)

  // when docked (inside the game view or the chat tab) the panel is always visible.
  const panelOpen = docked || open

  const latestTs = messages.length ? messages[messages.length - 1].ts : 0
  const myLastTs = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].from === identity) return messages[i].ts
    }
    return 0
  }, [messages, identity])

  // is my partner typing right now? (their last keystroke was very recent.)
  const partnerTyping =
    Boolean(partnerMeta?.typing) && Date.now() - partnerMeta.typing < TYPING_TTL

  // status of my most recent message: seen ▸ delivered ▸ sent.
  const myLastStatus =
    myLastTs === 0
      ? null
      : (partnerMeta?.seen || 0) >= myLastTs
        ? 'seen'
        : (partnerMeta?.delivered || 0) >= myLastTs
          ? 'delivered'
          : 'sent'

  // pop a desktop notification when a new message arrives from my partner.
  useEffect(() => {
    const fresh = messages.filter(
      (m) => m.from === partner && m.ts > mountTs.current && m.ts > notifiedTs.current,
    )
    if (fresh.length === 0) return
    const last = fresh[fresh.length - 1]
    notifiedTs.current = last.ts
    desktopNotify(`${partner} messaged you`, { body: last.text, tag: 'chat' })
  }, [messages, partner])

  // mark newest message as delivered to me the moment it arrives.
  useEffect(() => {
    if (latestTs) setChatDelivered(rt, latestTs)
  }, [rt, latestTs])

  // mark as seen while the panel is open and this tab is actually visible.
  useEffect(() => {
    if (!panelOpen || !latestTs) return undefined
    const mark = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setChatSeen(rt, latestTs)
      }
    }
    mark()
    document.addEventListener('visibilitychange', mark)
    return () => document.removeEventListener('visibilitychange', mark)
  }, [rt, panelOpen, latestTs])

  // keep the typing indicator fresh (it expires on its own after TYPING_TTL).
  useEffect(() => {
    if (!panelOpen) return undefined
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [panelOpen])

  useEffect(() => {
    if (panelOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, panelOpen, partnerTyping])

  useEffect(() => {
    if (panelOpen) {
      lastSeen.current = Date.now()
      setUnseen(0)
      return
    }
    setUnseen(messages.filter((m) => m.from === partner && m.ts > lastSeen.current).length)
  }, [messages, panelOpen, partner])

  // stop broadcasting "typing" when the panel closes or the component unmounts.
  useEffect(() => () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current)
    setChatTyping(rt, false)
  }, [rt])

  const stopTyping = () => {
    if (typingStopTimer.current) { clearTimeout(typingStopTimer.current); typingStopTimer.current = null }
    typingSentAt.current = 0
    setChatTyping(rt, false)
  }

  const onType = (value) => {
    setText(value)
    if (!value.trim()) { stopTyping(); return }
    const now = Date.now()
    if (now - typingSentAt.current > 1200) {
      typingSentAt.current = now
      setChatTyping(rt, true)
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current)
    typingStopTimer.current = setTimeout(stopTyping, 2500)
  }

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    sendChat(rt, t)
    setText('')
    setShowEmoji(false)
    stopTyping()
  }

  const addEmoji = (emoji) => {
    setText((t) => (t + emoji).slice(0, 300))
    if (inputRef.current) inputRef.current.focus()
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
        {messages.map((m) => {
          const mine = m.from === identity
          return (
            <div key={m.id} className={`chat-msg ${mine ? 'mine' : 'theirs'}`}>
              <span className="chat-from">{m.from} · {fmtTime(m.ts)}</span>
              <span className="chat-bubble">{m.text}</span>
              {mine && m.ts === myLastTs && myLastStatus && (
                <span className={`chat-receipt ${myLastStatus}`}>
                  {myLastStatus === 'seen' ? 'seen ✓✓'
                    : myLastStatus === 'delivered' ? 'delivered ✓✓'
                      : 'sent ✓'}
                </span>
              )}
            </div>
          )
        })}
        {partnerTyping && (
          <div className="chat-msg theirs">
            <span className="chat-from">{partner}</span>
            <span className="chat-bubble typing">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </span>
          </div>
        )}
      </div>

      <div className="chat-quick">
        {QUICK.map((q) => (
          <button key={q} className="quick-chip" onClick={() => sendChat(rt, q)}>{q}</button>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <div className="emoji-wrap">
          {showEmoji && (
            <div className="emoji-pop">
              {EMOJIS.map((em) => (
                <button key={em} type="button" className="emoji-btn" onClick={() => addEmoji(em)}>{em}</button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`emoji-toggle ${showEmoji ? 'on' : ''}`}
            onClick={() => setShowEmoji((s) => !s)}
            aria-label="emoji"
          >
            😊
          </button>
        </div>
        <input
          ref={inputRef}
          className="chat-input"
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={`message ${partner}...`}
          maxLength={300}
        />
        <button className="btn btn-pink" type="submit">send</button>
      </form>
    </div>
  )

  // docked: a permanent side panel (used inside the game view / chat tab).
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
