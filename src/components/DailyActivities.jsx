import { useEffect, useState } from 'react'
import { DAILY_ACTIVITIES, activityProgress, dailyState } from '../utils/dailyActivities'

export default function DailyActivities({ daily, onClaim, onVisit }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const state = dailyState(daily, now)
  return (
    <section className="daily-board panel" aria-label="daily activities">
      <div className="daily-heading">
        <div>
          <span className="title-pixel">insert coin</span>
          <h2>your next adventure</h2>
        </div>
        <small className="tiny muted">new quests each day · resets 00:00 utc</small>
      </div>
      <div className="daily-cards">
        {DAILY_ACTIVITIES.map((activity) => {
          const progress = Math.min(activityProgress(state, activity.id), activity.target)
          const claimed = state.claimed.includes(activity.id)
          const ready = progress >= activity.target
          return (
            <article key={activity.id} className={claimed ? 'daily-card daily-done' : 'daily-card'}>
              <span className={`daily-reward ${claimed ? 'is-done' : ''}`}>
                {claimed ? '1up collected' : `+${activity.coins} coins`}
              </span>
              <h3>{activity.title}</h3>
              <p>{activity.detail}</p>
              <progress value={progress} max={activity.target} aria-label={`${activity.title}: ${progress} of ${activity.target}`} />
              <button
                className={`btn ${claimed ? 'btn-purple' : ready ? 'btn-yellow' : 'btn-cyan'}`}
                disabled={claimed}
                onClick={() => (ready ? onClaim(activity.id) : onVisit(activity.destination))}
              >
                {claimed ? 'cleared' : ready ? 'collect reward' : `press start · ${progress}/${activity.target}`}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
