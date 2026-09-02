export default function Header({
  identity, partner, partnerOnline, coins, coinPop, onLogout,
  onNudge, notifPermission, notifSupported, onEnableNotify,
}) {
  const showBell = notifSupported && notifPermission !== 'granted' && notifPermission !== 'unsupported'

  return (
    <header className="header">
      <div className="brand">
        mehreenz + ali
        <small>arcade &amp; pets</small>
      </div>

      <div className="header-right">
        <span
          className={`hpill presence ${partnerOnline ? 'on' : ''}`}
          title={`${partner} is ${partnerOnline ? 'online' : 'away'}`}
        >
          <span className="hdot" aria-hidden />
          {partner}
        </span>

        <button className="hpill nudge" onClick={onNudge} title={`bug ${partner} to come play`}>
          <span aria-hidden>📣</span>
          bug {partner}
        </button>

        {showBell && (
          <button className="hpill hicon bell" onClick={onEnableNotify} title="turn on desktop alerts">
            🔔
          </button>
        )}

        <span className={`hpill coins ${coinPop ? 'pop' : ''}`} title="coins">◈ {coins}</span>

        <button className="hpill who" onClick={onLogout} title="log out">
          <span aria-hidden>{identity === 'mehreenz' ? '🌸' : '⭐'}</span>
          {identity}
          <span className="who-out" aria-hidden>⏻</span>
        </button>
      </div>
    </header>
  )
}
