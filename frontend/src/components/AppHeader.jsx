import { History, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function AppHeader({ user, isLoggingOut, onLogout }) {
  return (
    <header className="mb-10 flex items-start justify-between gap-4 sm:mb-12">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground">
          ONLINE QUIZ PLATFORM
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          JaneQ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome, {user?.firstName || user?.username}.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link to="/history">
            <History aria-hidden="true" />
            History
          </Link>
        </Button>
        <Button disabled={isLoggingOut} onClick={onLogout} variant="outline">
          <LogOut aria-hidden="true" />
          {isLoggingOut ? 'Signing out…' : 'Log out'}
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
