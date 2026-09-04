import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { applyDecay, daysAlive } from '../utils/petDecay'
import { XP_PER_LEVEL } from '../utils/rewards'

const LEGACY_KEY = 'mehreenz-pet-v1'
const keyFor = (identity) => `mehreenz-ali-pet-${identity || 'guest'}`

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)))

function makeInitialPet() {
  const now = Date.now()
  return {
    name: 'mochi',
    species: null,
    color: null,
    accessory: 'none',
    hunger: 75,
    happiness: 70,
    energy: 80,
    health: 90,
    xp: 0,
    level: 1,
    coins: 30,
    gamesPlayed: 0,
    highScores: { wordle: 0, tetris: 0, snake: 0, flappy: 0, pacman: 0 },
    startDate: now,
    lastVisit: now,
    lastFed: now,
    lastPlayed: now,
  }
}

export function usePet(identity) {
  const storageKey = keyFor(identity)

  // each person keeps their own pet. mehreenz inherits the old single-player
  // save the first time so nothing is lost.
  const initial = () => {
    if (identity === 'mehreenz') {
      try {
        const legacy = window.localStorage.getItem(LEGACY_KEY)
        if (legacy) return JSON.parse(legacy)
      } catch { /* ignore */ }
    }
    return makeInitialPet()
  }

  const [pet, setPet] = useLocalStorage(storageKey, initial)

  // apply gentle decay once on mount, based on time since last visit.
  const decayedOnce = useRef(false)
  useEffect(() => {
    if (decayedOnce.current) return
    decayedOnce.current = true
    setPet((prev) => applyDecay(prev, Date.now()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // slow live decay while the tab stays open (very light touch).
  useEffect(() => {
    const id = setInterval(() => {
      setPet((prev) => ({
        ...prev,
        hunger: clamp(prev.hunger - 0.4),
        happiness: clamp(prev.happiness - 0.3),
        energy: clamp(prev.energy - 0.2),
        lastVisit: Date.now(),
      }))
    }, 30000)
    return () => clearInterval(id)
  }, [setPet])

  const setName = useCallback((name) => {
    const clean = name.trim().toLowerCase().slice(0, 14)
    if (!clean) return
    setPet((prev) => ({ ...prev, name: clean }))
  }, [setPet])

  // choose which animal the pet is. optionally set a starting name and look.
  const setSpecies = useCallback((species, name, look = {}) => {
    setPet((prev) => ({
      ...prev,
      species,
      name: name ? name.trim().toLowerCase().slice(0, 14) : prev.name,
      color: look.color != null ? look.color : (prev.color ?? null),
      accessory: look.accessory != null ? look.accessory : (prev.accessory || 'none'),
    }))
  }, [setPet])

  const setLook = useCallback((look = {}) => {
    setPet((prev) => ({
      ...prev,
      color: look.color !== undefined ? look.color : prev.color,
      accessory: look.accessory !== undefined ? look.accessory : (prev.accessory || 'none'),
    }))
  }, [setPet])

  // apply an arbitrary bundle of stat changes and handle leveling up.
  // returns info about whether a level up happened (for animations).
  const applyReward = useCallback((reward = {}) => {
    let leveledUp = false
    let newLevel = 1
    let coinBonus = 0

    setPet((prev) => {
      let xp = prev.xp + (reward.xp || 0)
      let level = prev.level
      let coins = prev.coins + (reward.coins || 0)

      while (xp >= XP_PER_LEVEL) {
        xp -= XP_PER_LEVEL
        level += 1
        leveledUp = true
        const bonus = 20 + level * 5
        coins += bonus
        coinBonus += bonus
      }
      newLevel = level

      return {
        ...prev,
        hunger: clamp(prev.hunger + (reward.hunger || 0)),
        happiness: clamp(prev.happiness + (reward.happiness || 0)),
        energy: clamp(prev.energy + (reward.energy || 0)),
        health: clamp(prev.health + (reward.health || 0)),
        coins,
        xp,
        level,
        lastVisit: Date.now(),
      }
    })

    return { leveledUp, newLevel, coinBonus }
  }, [setPet])

  const recordGame = useCallback((game, score) => {
    setPet((prev) => {
      const prevHigh = prev.highScores?.[game] || 0
      const isHigh = score > prevHigh
      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        lastPlayed: Date.now(),
        highScores: {
          ...prev.highScores,
          [game]: isHigh ? score : prevHigh,
        },
      }
    })
  }, [setPet])

  const isNewHighScore = useCallback((game, score) => {
    return score > (pet.highScores?.[game] || 0)
  }, [pet.highScores])

  const feed = useCallback((item) => {
    if (pet.coins < item.cost) return false
    setPet((prev) => ({
      ...prev,
      coins: prev.coins - item.cost,
      hunger: clamp(prev.hunger + item.hunger),
      happiness: clamp(prev.happiness + (item.happiness || 0)),
      health: clamp(prev.health + 2),
      lastFed: Date.now(),
      lastVisit: Date.now(),
    }))
    return true
  }, [pet.coins, setPet])

  const petThePet = useCallback(() => {
    setPet((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 6),
      energy: clamp(prev.energy + 1),
      lastVisit: Date.now(),
    }))
  }, [setPet])

  const resetPet = useCallback(() => {
    setPet(makeInitialPet())
  }, [setPet])

  const days = useMemo(() => daysAlive(pet.startDate), [pet.startDate])

  // derive a mood string from the stats for pet animations.
  const mood = useMemo(() => {
    if (pet.energy < 25) return 'tired'
    if (pet.hunger < 30) return 'hungry'
    if (pet.happiness > 85 && pet.hunger > 60) return 'excited'
    if (pet.happiness > 55) return 'happy'
    if (pet.happiness < 35 || pet.health < 40) return 'sad'
    return 'happy'
  }, [pet.energy, pet.hunger, pet.happiness, pet.health])

  return {
    pet,
    mood,
    days,
    setName,
    setSpecies,
    setLook,
    applyReward,
    recordGame,
    isNewHighScore,
    feed,
    petThePet,
    resetPet,
  }
}
