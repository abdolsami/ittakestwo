import { useCallback, useEffect, useState } from 'react'
import { useRealtime, useWatch, usePartnerOnline } from '../realtime/RealtimeContext'
import { setPlaying, clearPlaying } from '../realtime/world'

const STALE_MS = 12000
const BEAT_MS = 2500

// each game uses this so we know if the other person is already in that
// machine, and we never silently join their session without asking.
export function usePlayTogether(game) {
  const rt = useRealtime()
  const partner = rt.partner
  const partnerOnline = usePartnerOnline()
  const theirs = useWatch(`games/${game}/playing/${partner}`)
  const [choice, setChoice] = useState(null) // null | 'together' | 'solo'
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const beat = () => setPlaying(rt, game, { choice: choice || 'here' })
    beat()
    const id = setInterval(beat, BEAT_MS)
    return () => {
      clearInterval(id)
      clearPlaying(rt, game)
    }
  }, [rt, game, choice])

  const partnerHere = Boolean(
    partnerOnline && theirs && now - (theirs.ts || 0) < STALE_MS,
  )

  const playTogether = useCallback(() => setChoice('together'), [])
  const playSolo = useCallback(() => setChoice('solo'), [])

  return {
    partner,
    partnerOnline,
    partnerHere,
    ask: choice == null && partnerHere,
    together: choice === 'together',
    solo: choice === 'solo',
    playTogether,
    playSolo,
  }
}
