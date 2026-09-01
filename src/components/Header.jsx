export default function Header({
  identity, partner, partnerOnline, coins, coinPop, onLogout,
  connected, mode, onNudge, notifPermission, notifSupported, onEnableNotify,
}) {
  const cloud = mode === 'firebase'
  const live = cloud ? (connected ? 'live' : 'connecting') : 'preview'
  const showBell = notifSupported && notifPermission !== 'granted' && notifPermission !== 'unsupported'

  return (
    <header className="header">
      <div className="brand">
        mehreenz + ali
        <small>arcade &amp; pets</small>
      </div>

      <div className="header-right">
        <span
          className={`hpill status ${live}`}
          title={cloud
            ? (connected ? 'connected to your cloud world' : 'connecting to cloud…')
            : 'preview mode — syncing between tabs on this device'}
        >
          <span className="hdot" aria-hidden />
          {cloud ? (connected ? 'live' : '…') : 'preview'}
        </span>

        <span
          className={`hpill presence ${partnerOnline ? 'on' : ''}`}
          title={`${partner} is ${partnerOnline ? 'online' : 'away'}`}
        >
          <span className="hdot" aria-hidden />
          {partner}
        </span>

        <button className="hpill hicon nudge" onClick={onNudge} title={`bug ${partner} to come play`}>
          📣
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
