import { History, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function AppHeader({ user, isLoggingOut, onLogout }) {
  return (
    <header className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground">
          ONLINE QUIZ PLATFORM
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          JaneQ
        </h1>
        <p className="mt-2 break-words text-sm text-muted-foreground">
          Welcome, {user?.firstName || user?.username}.
        </p>
      </div>
      <nav aria-label="Account navigation" className="flex flex-wrap justify-end gap-2">
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
      </nav>
    </header>
  )
}

export default AppHeader
