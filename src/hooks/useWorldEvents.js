import { useEffect, useMemo, useRef } from 'react'
import { useRealtime, useWatch } from '../realtime/RealtimeContext'

// live, time-sorted list of interaction events in the world.
export function useEventsList() {
  const events = useWatch('events', {})
  return useMemo(() => (
    Object.entries(events || {})
      .map(([id, e]) => ({ id, ...e }))
      .filter((e) => e && e.ts)
      .sort((a, b) => a.ts - b.ts)
  ), [events])
}

// call `handler(event)` once for every event that arrives AFTER mount.
export function useNewEvents(handler) {
  const list = useEventsList()
  const cutoff = useRef(Date.now())
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    let latest = cutoff.current
    for (const e of list) {
      if (e.ts > cutoff.current) {
        handlerRef.current(e)
        if (e.ts > latest) latest = e.ts
      }
    }
    cutoff.current = latest
  }, [list])
}

// keep the shared world tidy so chat/events don't grow without bound. only the
// host runs it (to avoid duplicate writes); it's cheap and idempotent.
const CHAT_KEEP = 120
const EVENT_TTL = 15 * 60 * 1000 // 15 minutes

export function useWorldMaintenance() {
  const rt = useRealtime()
  const chat = useWatch('chat', {})
  const events = useWatch('events', {})
  const isHost = rt && rt.identity === 'mehreenz'

  useEffect(() => {
    if (!isHost) return
    const now = Date.now()

    // trim chat to the most recent CHAT_KEEP messages.
    const chatEntries = Object.entries(chat || {})
      .filter(([, m]) => m && m.ts)
      .sort((a, b) => a[1].ts - b[1].ts)
    if (chatEntries.length > CHAT_KEEP) {
      chatEntries.slice(0, chatEntries.length - CHAT_KEEP)
        .forEach(([id]) => rt.remove(`chat/${id}`))
    }

    // drop one-off events once they're old.
    Object.entries(events || {}).forEach(([id, e]) => {
      if (e && e.ts && now - e.ts > EVENT_TTL) rt.remove(`events/${id}`)
    })
  }, [isHost, rt, chat, events])
}

// live chat log (last `limit` messages).
export function useChat(limit = 50) {
  const chat = useWatch('chat', {})
  return useMemo(() => (
    Object.entries(chat || {})
      .map(([id, m]) => ({ id, ...m }))
      .filter((m) => m && m.ts)
      .sort((a, b) => a.ts - b.ts)
      .slice(-limit)
  ), [chat, limit])
}
