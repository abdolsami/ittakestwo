import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FirebaseClient } from './firebaseClient'
import { LocalClient } from './localClient'
import { isFirebaseConfigured, worldIdFromCode, partnerOf } from './config'

const RealtimeContext = createContext(null)

export const REALTIME_MODE = isFirebaseConfigured() ? 'firebase' : 'local'

// how recently a heartbeat must have arrived to count someone as "online".
const ONLINE_WINDOW = 12000

export function RealtimeProvider({ code, identity, children }) {
  const clientRef = useRef(null)
  if (!clientRef.current) {
    clientRef.current = isFirebaseConfigured() ? new FirebaseClient() : new LocalClient()
  }
  const client = clientRef.current
  const base = `worlds/${worldIdFromCode(code)}`

  // tear the client down when the provider unmounts (e.g. on logout) so we
  // don't leak a BroadcastChannel that keeps handling messages.
  useEffect(() => () => {
    if (typeof client.destroy === 'function') client.destroy()
    clientRef.current = null
  }, [client])

  const api = useMemo(() => ({
    client,
    base,
    identity,
    partner: partnerOf(identity),
    mode: REALTIME_MODE,
    watch: (rel, cb) => client.watch(`${base}/${rel}`, cb),
    set: (rel, v) => client.set(`${base}/${rel}`, v),
    update: (rel, v) => client.update(`${base}/${rel}`, v),
    push: (rel, v) => client.push(`${base}/${rel}`, v),
    remove: (rel) => client.remove(`${base}/${rel}`),
    increment: (rel, d) => client.increment(`${base}/${rel}`, d),
  }), [client, base, identity])

  // heartbeat presence so the partner knows we're here.
  useEffect(() => {
    if (!identity) return undefined
    const beat = () => api.update(`presence/${identity}`, { online: true, ts: Date.now() })
    beat()
    const id = setInterval(beat, 4000)
    const goOffline = () => api.update(`presence/${identity}`, { online: false, ts: Date.now() })
    window.addEventListener('beforeunload', goOffline)
    return () => {
      clearInterval(id)
      goOffline()
      window.removeEventListener('beforeunload', goOffline)
    }
  }, [api, identity])

  return <RealtimeContext.Provider value={api}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  return useContext(RealtimeContext)
}

// subscribe to a world-relative path and get its live value.
export function useWatch(rel, defaultValue = null) {
  const rt = useRealtime()
  const [value, setValue] = useState(defaultValue)
  useEffect(() => {
    if (!rt || rel == null) return undefined
    return rt.watch(rel, (v) => setValue(v == null ? defaultValue : v))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt, rel])
  return value
}

// live connection status — for firebase this reflects a real handshake with the
// database, so it's proof the api keys are working. local mode is always true.
export function useConnectionStatus() {
  const rt = useRealtime()
  const [connected, setConnected] = useState(REALTIME_MODE !== 'firebase')
  useEffect(() => {
    if (!rt || !rt.client || !rt.client.watchConnection) { setConnected(true); return undefined }
    return rt.client.watchConnection(setConnected)
  }, [rt])
  return connected
}

// is the partner currently online? (based on their heartbeat freshness)
export function usePartnerOnline() {
  const rt = useRealtime()
  const presence = useWatch(rt ? `presence/${rt.partner}` : null)
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5000)
    return () => clearInterval(id)
  }, [])
  if (!presence) return false
  return Boolean(presence.online) && Date.now() - (presence.ts || 0) < ONLINE_WINDOW
}
