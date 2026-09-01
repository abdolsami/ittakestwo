import { useEffect, useState } from 'react'
import './Pet.css'
import { getAnimal } from '../utils/animals'

// an original pixel-art creature that can be any of several animals.
// colors + ear shape come from the chosen species; eyes, mouth and
// effects change with the pet's mood.

const OUTLINE = '#241a3d'

function Eyes({ mood, blink }) {
  if (mood === 'tired' || blink) {
    return (
      <>
        <rect x="11" y="15" width="4" height="1" fill={OUTLINE} />
        <rect x="17" y="15" width="4" height="1" fill={OUTLINE} />
      </>
    )
  }
  if (mood === 'excited') {
    return (
      <>
        <rect x="11" y="13" width="4" height="4" fill={OUTLINE} />
        <rect x="17" y="13" width="4" height="4" fill={OUTLINE} />
        <rect x="12" y="14" width="1" height="1" fill="#fff" />
        <rect x="18" y="14" width="1" height="1" fill="#fff" />
      </>
    )
  }
  if (mood === 'sad' || mood === 'hungry') {
    return (
      <>
        <rect x="11" y="14" width="3" height="3" fill={OUTLINE} />
        <rect x="18" y="14" width="3" height="3" fill={OUTLINE} />
        <rect x="12" y="14" width="1" height="1" fill="#fff" />
        <rect x="19" y="14" width="1" height="1" fill="#fff" />
      </>
    )
  }
  return (
    <>
      <rect x="11" y="13" width="3" height="3" fill={OUTLINE} />
      <rect x="18" y="13" width="3" height="3" fill={OUTLINE} />
      <rect x="12" y="13" width="1" height="1" fill="#fff" />
      <rect x="19" y="13" width="1" height="1" fill="#fff" />
    </>
  )
}

function Mouth({ mood, animal }) {
  // penguin gets a little beak instead of a drawn mouth.
  if (animal.ear === 'none') {
    return (
      <>
        <rect x="14" y="18" width="4" height="2" fill="#f6ad55" />
        <rect x="15" y="20" width="2" height="1" fill="#dd8a2e" />
      </>
    )
  }
  if (mood === 'excited') {
    return (
      <>
        <rect x="14" y="18" width="4" height="3" fill={OUTLINE} />
        <rect x="15" y="19" width="2" height="1" fill={animal.cheek} />
      </>
    )
  }
  if (mood === 'sad' || mood === 'hungry') {
    return (
      <>
        <rect x="14" y="19" width="1" height="1" fill={OUTLINE} />
        <rect x="15" y="18" width="2" height="1" fill={OUTLINE} />
        <rect x="17" y="19" width="1" height="1" fill={OUTLINE} />
      </>
    )
  }
  if (mood === 'tired') {
    return <rect x="15" y="19" width="2" height="1" fill={OUTLINE} />
  }
  return (
    <>
      <rect x="14" y="18" width="1" height="1" fill={OUTLINE} />
      <rect x="15" y="19" width="2" height="1" fill={OUTLINE} />
      <rect x="17" y="18" width="1" height="1" fill={OUTLINE} />
    </>
  )
}

function Ears({ animal }) {
  const { body, bodyDark, earIn, ear } = animal
  if (ear === 'none') return null

  if (ear === 'pointy') {
    return (
      <>
        <rect x="8" y="2" width="3" height="3" fill={body} />
        <rect x="7" y="4" width="4" height="5" fill={body} />
        <rect x="9" y="4" width="1" height="3" fill={earIn} />
        <rect x="21" y="2" width="3" height="3" fill={body} />
        <rect x="21" y="4" width="4" height="5" fill={body} />
        <rect x="22" y="4" width="1" height="3" fill={earIn} />
      </>
    )
  }

  if (ear === 'long') {
    return (
      <>
        <rect x="9" y="0" width="3" height="9" fill={body} />
        <rect x="10" y="1" width="1" height="6" fill={earIn} />
        <rect x="20" y="0" width="3" height="9" fill={body} />
        <rect x="21" y="1" width="1" height="6" fill={earIn} />
      </>
    )
  }

  if (ear === 'floppy') {
    return (
      <>
        <rect x="5" y="7" width="4" height="9" fill={bodyDark} />
        <rect x="5" y="15" width="4" height="1" fill={OUTLINE} />
        <rect x="23" y="7" width="4" height="9" fill={bodyDark} />
        <rect x="23" y="15" width="4" height="1" fill={OUTLINE} />
      </>
    )
  }

  if (ear === 'bump') {
    // frog-style eye bumps on top of the head.
    return (
      <>
        <rect x="8" y="3" width="5" height="5" fill={body} />
        <rect x="9" y="4" width="3" height="3" fill="#fff" />
        <rect x="10" y="5" width="1" height="1" fill={OUTLINE} />
        <rect x="19" y="3" width="5" height="5" fill={body} />
        <rect x="20" y="4" width="3" height="3" fill="#fff" />
        <rect x="21" y="5" width="1" height="1" fill={OUTLINE} />
      </>
    )
  }

  // round (bear / panda / mochi)
  return (
    <>
      <rect x="7" y="4" width="5" height="5" fill={body} />
      <rect x="8" y="5" width="3" height="3" fill={earIn} />
      <rect x="20" y="4" width="5" height="5" fill={body} />
      <rect x="21" y="5" width="3" height="3" fill={earIn} />
    </>
  )
}

export default function Pet({ mood = 'happy', species, feeding = false, petting = false, facing = 'right', pose = '' }) {
  const [blink, setBlink] = useState(false)
  const animal = getAnimal(species)

  useEffect(() => {
    let timeout
    const loop = () => {
      const delay = 2200 + Math.random() * 2600
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
        loop()
      }, delay)
    }
    loop()
    return () => clearTimeout(timeout)
  }, [])

  const animClass = `pet pet-${mood} ${feeding ? 'pet-feeding' : ''} ${petting ? 'pet-petting' : ''} ${pose ? `pet-${pose}` : ''}`

  return (
    <div className={animClass} style={facing === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
      {/* thought / effect bubbles */}
      {mood === 'hungry' && (
        <div className="pet-bubble food-bubble" aria-hidden>🍎</div>
      )}
      {mood === 'tired' && (
        <div className="pet-bubble zzz-bubble" aria-hidden>z</div>
      )}
      {(mood === 'excited') && (
        <>
          <div className="pet-spark spark-1" aria-hidden>✨</div>
          <div className="pet-spark spark-2" aria-hidden>✨</div>
        </>
      )}
      {(mood === 'happy' || mood === 'excited' || petting) && (
        <div className="pet-note" aria-hidden>♪</div>
      )}
      {petting && (
        <>
          <div className="pet-note note-b" aria-hidden>♫</div>
          <div className="pet-note note-c" aria-hidden>♪</div>
        </>
      )}
      {feeding && <div className="pet-eat" aria-hidden>😋</div>}

      <svg
        className="pet-svg"
        viewBox="0 0 32 32"
        width="180"
        height="180"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`your ${animal.label} looks ${mood}`}
      >
        {/* feet */}
        <rect x="9" y="26" width="5" height="3" fill={animal.bodyDark} />
        <rect x="18" y="26" width="5" height="3" fill={animal.bodyDark} />
        <rect x="9" y="28" width="5" height="1" fill={OUTLINE} />
        <rect x="18" y="28" width="5" height="1" fill={OUTLINE} />

        <Ears animal={animal} />

        {/* body outline */}
        <rect x="7" y="8" width="18" height="18" fill={OUTLINE} />
        {/* body fill */}
        <rect x="8" y="9" width="16" height="16" fill={animal.body} />
        <rect x="8" y="9" width="16" height="2" fill="#ffffff" fillOpacity="0.18" />
        <rect x="8" y="22" width="16" height="3" fill={animal.bodyShade} />

        {/* belly */}
        <rect x="12" y="18" width="8" height="6" fill={animal.belly} />
        <rect x="13" y="24" width="6" height="1" fill={animal.bodyShade} />

        {/* cheeks */}
        {mood !== 'sad' && (
          <>
            <rect x="9" y="17" width="2" height="2" fill={animal.cheek} />
            <rect x="21" y="17" width="2" height="2" fill={animal.cheek} />
          </>
        )}

        <Eyes mood={mood} blink={blink} />
        <Mouth mood={mood} animal={animal} />
      </svg>

      <div className="pet-shadow" aria-hidden />
    </div>
  )
}
