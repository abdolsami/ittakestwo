import { createContext, useCallback, useContext, useRef, useState } from 'react'

const NotifContext = createContext(null)

export function useNotify() {
  const ctx = useContext(NotifContext)
  if (!ctx) return () => {}
  return ctx
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const notify = useCallback((message, icon = '✨') => {
    const id = ++idRef.current
    setItems((prev) => [...prev, { id, message, icon, leaving: false }])
    // start leave animation, then remove.
    setTimeout(() => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)))
    }, 2600)
    setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id))
    }, 2950)
  }, [])

  return (
    <NotifContext.Provider value={notify}>
      {children}
      <div className="notif-layer">
        {items.map((n) => (
          <div key={n.id} className={`notif ${n.leaving ? 'notif-leave' : ''}`}>
            <span aria-hidden>{n.icon}</span>
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </NotifContext.Provider>
  )
}
