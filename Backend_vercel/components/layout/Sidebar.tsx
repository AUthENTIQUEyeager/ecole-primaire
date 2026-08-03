'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  CalendarX,
  Wallet,
  FileText,
  Megaphone,
  Banknote,
  Receipt,
  Settings,
  PartyPopper,
} from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/eleves', label: 'Élèves', icon: Users },
  { href: '/admin/classes', label: 'Classes', icon: School },
  { href: '/admin/notes', label: 'Notes & Bulletins', icon: BookOpen },
  { href: '/admin/absences', label: 'Absences', icon: CalendarX },
  { href: '/admin/paiements', label: 'Paiements', icon: Wallet },
  { href: '/admin/evenements', label: 'Sorties & Clôtures', icon: PartyPopper },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/annonces', label: 'Annonces', icon: Megaphone },
  { href: '/admin/salaires', label: 'Salaires', icon: Banknote },
  { href: '/admin/depenses', label: 'Dépenses', icon: Receipt },
  { href: '/admin/configuration', label: 'Configuration', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-card text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #ff6a3d)' }}
        >
          <School size={18} />
        </div>
        <span className="text-sm font-semibold leading-tight text-text">
          Norio
          <br />
          <span className="font-normal text-muted">Gestion scolaire</span>
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-input px-3 py-2 text-sm transition ${
                active
                  ? 'bg-blue-50 font-medium text-primary'
                  : 'text-text hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
