const TABS = [
  { id: 'home', label: 'home', icon: '🏠' },
  { id: 'games', label: 'games', icon: '🕹️' },
  { id: 'park', label: 'park', icon: '🌳' },
  { id: 'pet', label: 'pet', icon: '🐾' },
  { id: 'stats', label: 'stats', icon: '📊' },
]

export default function Navigation({ active, onChange }) {
  return (
    <nav className="nav nav-5">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-ico" aria-hidden>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
