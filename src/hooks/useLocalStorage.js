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
  const valueRef = useRef(value)

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {
      // storage may be full or unavailable; fail quietly.
    }
  }, [value])

  const set = useCallback((next) => {
    // Resolve against the latest value immediately, including multiple actions
    // in one event. React updater functions may run later or more than once.
    const resolved = typeof next === 'function' ? next(valueRef.current) : next
    valueRef.current = resolved
    setValue(resolved)
  }, [])

  return [value, set]
}
