import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRealtime, useWatch, useConnectionStatus } from '../realtime/RealtimeContext'
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
const TYPING_TTL = 4000
const TYPING_PULSE = 1200
const TYPING_IDLE = 2500

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()

export default function FloatingChat({
  identity, partner, partnerOnline, docked = false, autoFocus = false,
}) {
  const rt = useRealtime()
  const connected = useConnectionStatus()
  const messages = useChat(60)
  const partnerMeta = useWatch(`chatMeta/${partner}`, {})

  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [pending, setPending] = useState([])
  const [sendError, setSendError] = useState('')
  const [unseen, setUnseen] = useState(0)
  const [, setTick] = useState(0)

  const listRef = useRef(null)
  const inputRef = useRef(null)
  const lastSeen = useRef(Date.now())
  const mountTs = useRef(Date.now())
  const notifiedTs = useRef(0)
  const typingSentAt = useRef(0)
  const typingStopTimer = useRef(null)

  const panelOpen = docked || open

  const myLastTs = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].from === identity) return messages[i].ts
    }
    return 0
  }, [messages, identity])

  const latestPartnerTs = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].from === partner) return messages[i].ts
    }
    return 0
  }, [messages, partner])

  const partnerTyping =
    Boolean(partnerMeta?.typing) && Date.now() - partnerMeta.typing < TYPING_TTL

  const myLastStatus = !myLastTs
    ? null
    : (partnerMeta?.seen || 0) >= myLastTs
      ? 'seen'
      : (partnerMeta?.delivered || 0) >= myLastTs
        ? 'delivered'
        : 'sent'

  // optimistic locals drop out as soon as the same firebase key lands.
  const visible = useMemo(() => {
    if (pending.length === 0) return messages
    const seen = new Set(messages.map((m) => m.id))
    return messages.concat(pending.filter((m) => !seen.has(m.id)))
  }, [messages, pending])

  const stopTyping = useCallback(() => {
    if (typingStopTimer.current) {
      clearTimeout(typingStopTimer.current)
      typingStopTimer.current = null
    }
    typingSentAt.current = 0
    setChatTyping(rt, false)
  }, [rt])

  const onType = useCallback((value) => {
    setText(value)
    if (!value.trim()) { stopTyping(); return }
    const now = Date.now()
    if (now - typingSentAt.current > TYPING_PULSE) {
      typingSentAt.current = now
      setChatTyping(rt, true)
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current)
    typingStopTimer.current = setTimeout(stopTyping, TYPING_IDLE)
  }, [rt, stopTyping])

  const postMessage = useCallback((raw) => {
    const t = String(raw).trim().slice(0, 300)
    if (!t) return

    let request
    try {
      request = sendChat(rt, t)
    } catch {
      setSendError('could not send. try again')
      return
    }

    const local = {
      id: request.key || `pending-${Date.now()}`,
      from: identity,
      text: t,
      ts: request.payload?.ts || Date.now(),
    }
    setPending((list) => [...list, local])
    setSendError('')
    stopTyping()

    request.catch(() => {
      setPending((list) => list.filter((item) => item.id !== local.id))
      setSendError('could not send. try again')
      setText((current) => current || t)
    })
  }, [rt, identity, stopTyping])

  const submit = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const t = text.trim()
    if (!t) return
    setText('')
    setShowEmoji(false)
    postMessage(t)
  }, [text, postMessage])

  const addEmoji = useCallback((emoji) => {
    setText((t) => (t + emoji).slice(0, 300))
    inputRef.current?.focus()
  }, [])

  const keepKeysHere = useCallback((e) => e.stopPropagation(), [])

  // desktop notify for new partner messages
  useEffect(() => {
    const fresh = messages.filter(
      (m) => m.from === partner && m.ts > mountTs.current && m.ts > notifiedTs.current,
    )
    if (!fresh.length) return
    const last = fresh[fresh.length - 1]
    notifiedTs.current = last.ts
    desktopNotify(`${partner} messaged you`, { body: last.text, tag: 'chat' })
  }, [messages, partner])

  // receipts only for partner messages (not our own)
  useEffect(() => {
    if (latestPartnerTs) setChatDelivered(rt, latestPartnerTs)
  }, [rt, latestPartnerTs])

  useEffect(() => {
    if (!panelOpen || !latestPartnerTs) return undefined
    const mark = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setChatSeen(rt, latestPartnerTs)
      }
    }
    mark()
    document.addEventListener('visibilitychange', mark)
    return () => document.removeEventListener('visibilitychange', mark)
  }, [rt, panelOpen, latestPartnerTs])

  // only pulse the clock while a typing indicator might expire
  useEffect(() => {
    if (!panelOpen || !partnerMeta?.typing) return undefined
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [panelOpen, partnerMeta?.typing])

  useEffect(() => {
    if (panelOpen && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [visible, panelOpen, partnerTyping])

  useEffect(() => {
    if (panelOpen) {
      lastSeen.current = Date.now()
      setUnseen(0)
      return
    }
    setUnseen(messages.filter((m) => m.from === partner && m.ts > lastSeen.current).length)
  }, [messages, panelOpen, partner])

  useEffect(() => () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current)
    setChatTyping(rt, false)
  }, [rt])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // clear optimistic rows once the live list has their ids
  useEffect(() => {
    if (!pending.length) return
    const live = new Set(messages.map((m) => m.id))
    setPending((list) => {
      const next = list.filter((m) => !live.has(m.id))
      return next.length === list.length ? list : next
    })
  }, [messages, pending.length])

  const panel = (
    <div
      className={`chat-panel ${docked ? 'docked' : ''}`}
      onPointerDown={(e) => {
        if (e.target?.closest?.('button, a, input, textarea')) return
        inputRef.current?.focus()
      }}
      onKeyDown={keepKeysHere}
      onKeyUp={keepKeysHere}
    >
      <div className="chat-head">
        <span className="title-pixel">chat</span>
        <span className={`presence-badge ${partnerOnline ? 'on' : ''}`}>
          <span className="presence-dot" aria-hidden />
          {partner} {partnerOnline ? 'online' : 'away'}
        </span>
      </div>

      <div className="chat-log" ref={listRef}>
        {visible.length === 0 && (
          <p className="tiny muted center" style={{ padding: '20px 0' }}>
            say something to {partner}
          </p>
        )}
        {!connected && (
          <p className="tiny muted center" style={{ padding: '8px 0' }}>
            reconnecting…
          </p>
        )}
        {sendError && (
          <p className="tiny muted center" style={{ padding: '8px 0', color: 'var(--pink-soft)' }}>
            {sendError}
          </p>
        )}
        {visible.map((m) => {
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
          <button key={q} type="button" className="quick-chip" onClick={() => postMessage(q)}>{q}</button>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={submit} onKeyDown={keepKeysHere} onKeyUp={keepKeysHere}>
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
          onKeyDown={keepKeysHere}
          onKeyUp={keepKeysHere}
          placeholder={`message ${partner}...`}
          maxLength={300}
          autoComplete="off"
        />
        <button className="btn btn-pink" type="submit">send</button>
      </form>
    </div>
  )

  if (docked) return panel

  return (
    <>
      <button
        type="button"
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
