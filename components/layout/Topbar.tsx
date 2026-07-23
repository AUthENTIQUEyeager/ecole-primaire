'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

export function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-text">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-primary">
            <User size={16} />
          </div>
          <span className="font-medium">{session?.user?.name ?? '—'}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1 rounded-input px-2 py-1.5 text-sm text-muted hover:bg-slate-50 hover:text-danger"
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
