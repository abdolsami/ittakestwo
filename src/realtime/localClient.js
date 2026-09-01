// a tiny realtime client that mimics the firebase interface but runs entirely
// in the browser. it syncs between tabs/windows on the SAME machine using a
// BroadcastChannel, and keeps a persistent cache so a freshly opened tab still
// sees the latest world. this is the fallback used until a real firebase
// project is configured — it lets the whole experience work for previewing.

const CACHE_KEY = 'mehreenz-ali-world-cache-v1'

function splitPath(path) {
  return String(path).split('/').filter(Boolean)
}

function getAt(tree, path) {
  const parts = splitPath(path)
  let node = tree
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return undefined
    node = node[p]
  }
  return node
}

function setAt(tree, path, value) {
  const parts = splitPath(path)
  if (parts.length === 0) return value
  let node = tree
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (node[key] == null || typeof node[key] !== 'object') node[key] = {}
    node = node[key]
  }
  const last = parts[parts.length - 1]
  if (value === undefined || value === null) delete node[last]
  else node[last] = value
  return tree
}

export class LocalClient {
  constructor() {
    this.tree = this.loadCache()
    this.watchers = new Map() // path -> Set(cb)
    this.channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('mehreenz-ali-world')
      : null
    this.tabId = Math.random().toString(36).slice(2)

    if (this.channel) {
      this.channel.onmessage = (e) => this.onMessage(e.data)
      // ask any other open tab for its current world.
      this.channel.postMessage({ type: 'sync-req', from: this.tabId })
    }

    this.saveSoon = debounce(() => this.saveCache(), 250)
  }

  loadCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveCache() {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(this.tree))
    } catch {
      /* ignore */
    }
  }

  onMessage(msg) {
    if (!msg || msg.from === this.tabId) return
    if (msg.type === 'sync-req') {
      // reply with our whole world if we have anything.
      if (Object.keys(this.tree).length > 0) {
        this.channel.postMessage({ type: 'sync-res', from: this.tabId, tree: this.tree })
      }
      return
    }
    if (msg.type === 'sync-res') {
      this.tree = deepMerge(this.tree, msg.tree)
      this.saveSoon()
      this.notifyAll()
      return
    }
    if (msg.type === 'mutate') {
      setAt(this.tree, msg.path, msg.value)
      this.saveSoon()
      this.notifyPath(msg.path)
    }
  }

  broadcast(path, value) {
    if (this.channel) this.channel.postMessage({ type: 'mutate', from: this.tabId, path, value })
  }

  notifyAll() {
    for (const [path, cbs] of this.watchers) {
      const val = getAt(this.tree, path)
      cbs.forEach((cb) => cb(val))
    }
  }

  // notify every watcher whose path is affected by a change at `path`.
  notifyPath(changed) {
    for (const [wp, cbs] of this.watchers) {
      if (wp === changed || changed.startsWith(`${wp}/`) || wp.startsWith(`${changed}/`)) {
        const val = getAt(this.tree, wp)
        cbs.forEach((cb) => cb(val))
      }
    }
  }

  watch(path, cb) {
    if (!this.watchers.has(path)) this.watchers.set(path, new Set())
    this.watchers.get(path).add(cb)
    // fire immediately with current value.
    cb(getAt(this.tree, path))
    return () => {
      const set = this.watchers.get(path)
      if (set) {
        set.delete(cb)
        if (set.size === 0) this.watchers.delete(path)
      }
    }
  }

  set(path, value) {
    setAt(this.tree, path, value)
    this.saveSoon()
    this.notifyPath(path)
    this.broadcast(path, value)
  }

  update(path, partial) {
    const current = getAt(this.tree, path) || {}
    const next = { ...current, ...partial }
    this.set(path, next)
  }

  push(path, value) {
    const key = `k${Date.now()}${Math.random().toString(36).slice(2, 6)}`
    this.set(`${path}/${key}`, value)
    return key
  }

  remove(path) {
    this.set(path, undefined)
  }

  increment(path, delta) {
    const current = Number(getAt(this.tree, path) || 0)
    this.set(path, current + delta)
  }

  // the local client is always "connected" (it's this device).
  watchConnection(cb) {
    cb(true)
    return () => {}
  }

  // close the channel and drop watchers so a stale client from a previous
  // login cycle doesn't keep reacting to broadcasts.
  destroy() {
    if (this.channel) {
      this.channel.onmessage = null
      this.channel.close()
      this.channel = null
    }
    this.watchers.clear()
  }
}

function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

function deepMerge(a, b) {
  if (b == null) return a
  if (typeof b !== 'object' || Array.isArray(b)) return b
  const out = { ...(a && typeof a === 'object' ? a : {}) }
  for (const k of Object.keys(b)) {
    out[k] = deepMerge(out[k], b[k])
  }
  return out
}
