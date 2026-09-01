import { useState } from 'react'
import Pet from './Pet'
import GiftMenu from './GiftMenu'
import { FriendshipStars } from './Friendship'
import { feeling, moodFromSnapshot } from '../utils/petText'

export default function PetPage({
  identity, pet, mood, feeding, petting,
  partner, partnerPet, partnerOnline, friendship,
  onFeed, onPet, onRename, onWave, onGift,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(pet.name || '')
  const [giftOpen, setGiftOpen] = useState(false)

  const partnerMood = moodFromSnapshot(partnerPet)
  const hasPartner = Boolean(partnerPet?.species)
  const canInteract = hasPartner && partnerOnline

  const saveName = (e) => {
    e.preventDefault()
    if (draft.trim()) onRename(draft)
    setEditing(false)
  }

  return (
    <div className="screen-enter stack">
      {/* main focus: your pet */}
      <div className="section-head">
        <span className="title-pixel">{identity}'s pet</span>
        <span className="line" />
      </div>

      <div className="pet-window">
        <div className="floor" />
        <div className="pet-stage">
          <Pet mood={mood} species={pet.species} feeding={feeding} petting={petting} />
        </div>
      </div>

      <div className="center">
        <p className="hint">
          {pet.name || 'your pet'} is {feeling(mood)}
        </p>
      </div>

      <div className="btn-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button className="btn btn-yellow" onClick={onFeed}>feed</button>
        <button className="btn btn-cyan btn-glow" onClick={onPet}>pet</button>
      </div>

      {editing ? (
        <form className="rename-row" onSubmit={saveName}>
          <input
            className="name-input"
            style={{ margin: 0, fontSize: 12, padding: 12 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="a new name"
            maxLength={14}
            autoFocus
          />
          <button className="btn btn-green" type="submit">save</button>
        </form>
      ) : (
        <p className="hint center">
          your pet is called {pet.name}.{' '}
          <button className="text-link" onClick={() => { setDraft(pet.name || ''); setEditing(true) }}>rename</button>
        </p>
      )}

      {/* smaller focus: partner's pet */}
      <div className="section-head">
        <span className="title-pixel">{partner}'s pet</span>
        <span className="line" />
        <span className={`presence-dot inline ${partnerOnline ? 'on' : ''}`} aria-hidden />
      </div>

      <div className="partner-card panel">
        <div className="partner-pet">
          {hasPartner ? (
            <Pet mood={partnerMood} species={partnerPet.species} facing="left" />
          ) : (
            <div className="pet-empty">
              <span className="pet-empty-egg" aria-hidden>🥚</span>
            </div>
          )}
        </div>
        <div className="partner-info">
          <div className="partner-name">{hasPartner ? (partnerPet.name || partner) : `${partner}'s pet`}</div>
          <p className="hint">
            {!hasPartner ? `${partner} hasn't picked a pet yet`
              : partnerOnline ? `${partnerPet.name || partner} is ${feeling(partnerMood)}`
                : `${partner} is away right now`}
          </p>
          <FriendshipStars points={friendship} size="sm" />
          <div className="partner-actions">
            <button className="btn btn-pink" disabled={!canInteract} onClick={onWave}>wave 👋</button>
            <button className="btn btn-purple" disabled={!canInteract} onClick={() => setGiftOpen(true)}>gift 🎁</button>
          </div>
          {!canInteract && hasPartner && (
            <p className="tiny muted">interact when {partner} is online</p>
          )}
        </div>
      </div>

      {giftOpen && (
        <GiftMenu
          partner={partner}
          onClose={() => setGiftOpen(false)}
          onGift={(g) => onGift(g)}
        />
      )}
    </div>
  )
}
