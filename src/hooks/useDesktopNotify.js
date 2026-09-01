import { useCallback, useEffect, useState } from 'react'

// thin wrapper around the browser Notifications API (the little pop-ups chrome
// shows outside the tab). it's optional — if the browser doesn't support it or
// the user hasn't allowed it, these calls just quietly do nothing.

const supported = typeof window !== 'undefined' && 'Notification' in window

// show a desktop notification. by default we only pop one when the tab is NOT
// focused (so we don't nag while you're already looking). pass force:true for
// things that should always grab attention, like a nudge.
export function desktopNotify(title, { body = '', tag, force = false } = {}) {
  if (!supported || Notification.permission !== 'granted') return
  if (!force && typeof document !== 'undefined' && document.visibilityState === 'visible') return
  try {
    const n = new Notification(title, { body, tag })
    n.onclick = () => { try { window.focus() } catch { /* ignore */ } n.close() }
    setTimeout(() => n.close(), 8000)
  } catch { /* ignore */ }
}

// track/ask for permission (for an "enable alerts" button).
export function useNotifyPermission() {
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')

  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)
  }, [])

  const request = useCallback(async () => {
    if (!supported) return 'unsupported'
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      return 'denied'
    }
  }, [])

  return { supported, permission, request }
}
