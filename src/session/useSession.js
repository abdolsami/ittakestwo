import { useCallback, useState } from 'react'
import { IDENTITIES, identityForCode } from '../realtime/config'

const ID_KEY = 'mehreenz-ali-identity'

// which person is logged in on this tab. identity is stored in sessionStorage
// (per-tab) first — so two tabs on one computer can be two different people for
// testing — and falls back to a remembered localStorage value for normal
// returning visits. a ?me=mehreenz / ?me=ali url param is a dev shortcut.
function readIdentity() {
  const url = new URLSearchParams(window.location.search).get('me')
  if (url && IDENTITIES.includes(url)) return url
  try {
    return sessionStorage.getItem(ID_KEY) || localStorage.getItem(ID_KEY) || null
  } catch {
    return null
  }
}

export function useSession() {
  const [identity, setIdentity] = useState(readIdentity)

  // type a password → log straight into whichever account it belongs to.
  const login = useCallback((entered) => {
    const who = identityForCode(entered)
    if (!who) return false
    try {
      sessionStorage.setItem(ID_KEY, who)
      localStorage.setItem(ID_KEY, who)
    } catch { /* ignore */ }
    setIdentity(who)
    return true
  }, [])

  // log out completely — back to the password screen (used to switch people).
  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(ID_KEY)
      localStorage.removeItem(ID_KEY)
    } catch { /* ignore */ }
    setIdentity(null)
  }, [])

  return {
    identity,
    ready: Boolean(identity),
    login,
    logout,
  }
}
