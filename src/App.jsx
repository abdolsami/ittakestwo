import { NotificationProvider } from './components/Notification'
import { RealtimeProvider } from './realtime/RealtimeContext'
import { WORLD_ID } from './realtime/config'
import { useSession } from './session/useSession'
import AccessGate from './session/AccessGate'
import World from './World'

export default function App() {
  const session = useSession()

  return (
    <div className="crt">
      <NotificationProvider>
        {!session.ready ? (
          <AccessGate onLogin={session.login} />
        ) : (
          <RealtimeProvider code={WORLD_ID} identity={session.identity}>
            <World
              key={session.identity}
              identity={session.identity}
              onLogout={session.logout}
            />
          </RealtimeProvider>
        )}
      </NotificationProvider>
    </div>
  )
}
