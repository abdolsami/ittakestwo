// skip a network write when the payload has not changed.
export function shouldPublish(lastRef, payload) {
  const key = cheapKey(payload)
  if (lastRef.current === key) return false
  lastRef.current = key
  return true
}

function cheapKey(payload) {
  if (!payload || typeof payload !== 'object') return String(payload)
  if (payload.piece || payload.body || payload.eaten || payload.ghosts || payload.cells) {
    return JSON.stringify(payload)
  }
  let out = ''
  for (const k in payload) {
    const v = payload[k]
    out += k
    out += ':'
    out += (v && typeof v === 'object') ? JSON.stringify(v) : v
    out += '|'
  }
  return out
}
