import { useCallback, useEffect, useRef, useState } from 'react'

// a small hook that keeps a piece of state synced to localstorage.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) {
        return typeof initialValue === 'function' ? initialValue() : initialValue
      }
      return JSON.parse(raw)
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue
    }
  })

  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {
      // storage may be full or unavailable; fail quietly.
    }
  }, [value])

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, set]
}
