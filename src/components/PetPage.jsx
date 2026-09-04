import { useState } from 'react'
import Pet from './Pet'
import GiftMenu from './GiftMenu'
import { AccessoryBoard, ColorBoard } from './LookStudio'
import { FriendshipStars } from './Friendship'
import { feeling, moodFromSnapshot } from '../utils/petText'
import { accessoryLabel, lookFrom, looksFor } from '../utils/appearance'

export default function PetPage({
  identity, pet, mood, feeding, petting,
  partner, partnerPet, partnerOnline, friendship,
  onFeed, onPet, onRename, onLook, onWave, onGift,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(pet.name || '')
  const [giftOpen, setGiftOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const look = lookFrom(pet)
  const partnerLook = lookFrom(partnerPet)

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
          <Pet mood={mood} species={look.species} color={look.color} accessory={look.accessory} feeding={feeding} petting={petting} />
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
          {' · '}
          <button className="text-link" onClick={() => setCustomOpen((v) => !v)}>
            {customOpen ? 'done styling' : 'change look'}
          </button>
        </p>
      )}

      {customOpen && (
        <div className="panel customize-panel">
          <div className="section-head">
            <span className="title-pixel">color</span>
            <span className="line" />
          </div>
          <ColorBoard
            value={look.color}
            fallback={looksFor(pet.species).body}
            onChange={(color) => onLook({ color })}
          />
          <div className="section-head" style={{ marginTop: 14 }}>
            <span className="title-pixel">accessory</span>
            <span className="line" />
          </div>
          <AccessoryBoard
            value={look.accessory}
            onChange={(accessory) => onLook({ accessory })}
          />
          <p className="tiny muted center" style={{ marginTop: 10 }}>
            {look.accessory === 'none' ? 'no accessory' : `wearing a ${accessoryLabel(look.accessory)}`}
          </p>
        </div>
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
            <Pet mood={partnerMood} species={partnerLook.species} color={partnerLook.color} accessory={partnerLook.accessory} facing="left" />
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
