import { FOOD_ITEMS } from '../utils/rewards'

const HAPPY_MESSAGES = [
  'yum',
  'that made your pet happy',
  'your pet seems to like that',
  'your pet is feeling much better',
  'your pet seems happy to see you',
]

export default function FeedMenu({ pet, onFeed }) {
  return (
    <div className="screen-enter">
      <div className="section-head">
        <span className="title-pixel">food shop</span>
        <span className="line" />
      </div>
      <p className="hint">spend coins to feed your pet. you have <b style={{ color: 'var(--yellow)' }}>◈ {pet.coins}</b> coins.</p>

      <div className="shop-grid">
        {FOOD_ITEMS.map((item) => {
          const affordable = pet.coins >= item.cost
          return (
            <div className="food-card" key={item.id}>
              <div className="food-emoji" aria-hidden>{item.emoji}</div>
              <div className="food-name">{item.label}</div>
              <div className="food-effect">
                +{item.hunger} hunger
                {item.happiness ? <><br />+{item.happiness} happiness</> : null}
              </div>
              <div className="food-cost">◈ {item.cost}</div>
              <button
                className="btn btn-pink"
                style={{ width: '100%', fontSize: 9 }}
                disabled={!affordable}
                onClick={() => onFeed(item, HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)])}
              >
                {affordable ? 'feed' : 'need coins'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="hint center mt-24">play games in the arcade to earn more coins for treats.</p>
    </div>
  )
}
