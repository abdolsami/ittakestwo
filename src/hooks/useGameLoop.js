import { useEffect, useRef } from 'react'

// one requestAnimationFrame loop for the life of the game screen.
// the tick function can change every render; the loop itself never restarts.
export function useGameLoop(tick) {
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    let id = 0
    const loop = (time) => {
      tickRef.current(time)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}
