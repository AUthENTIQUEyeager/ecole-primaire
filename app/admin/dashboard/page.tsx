'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { Users, School, Wallet, CalendarX, Plus } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/paiement'
import { localDB } from '@/lib/sync/indexedDB'

function auj() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const stats = useLiveQuery(async () => {
    if (!localDB) return null
    const [eleves, classes, absences, versements, paiements] = await Promise.all([
      localDB.eleves.where('actif').equals(1).toArray(),
      localDB.classes.toArray(),
      localDB.absences.toArray(),
      localDB.versements.toArray(),
      localDB.paiements.toArray(),
    ])
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const elevesById = new Map(eleves.map((e) => [e.id, e]))

    const today = auj()
    const moisCourant = today.slice(0, 7)
    const dans7jMin = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const dans14jMax = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

    const absencesAujourdhui = absences.filter((a) => a.date_absence === today).length
    const encaissementsMois = versements
      .filter((v) => v.date_versement.slice(0, 7) === moisCourant)
      .reduce((a, v) => a + v.montant, 0)

    const absencesRecentes = absences
      .filter((a) => a.date_absence >= dans7jMin)
      .sort((a, b) => (a.date_absence < b.date_absence ? 1 : -1))
      .slice(0, 8)
      .map((a) => {
        const e = elevesById.get(a.eleve_id)
        const c = e ? classesById.get(e.classe_id) : undefined
        return { ...a, nom: e?.nom, prenom: e?.prenom, classe_nom: c?.nom }
      })

    const echeancesProches = paiements
      .filter((p) => p.statut !== 'soldee' && p.date_echeance <= dans14jMax)
      .sort((a, b) => (a.date_echeance > b.date_echeance ? 1 : -1))
      .slice(0, 8)
      .map((p) => {
        const e = elevesById.get(p.eleve_id)
        return { ...p, nom: e?.nom, prenom: e?.prenom }
      })

    return {
      totalEleves: eleves.length,
      totalClasses: classes.length,
      absencesAujourdhui,
      encaissementsMois,
      absencesRecentes,
      echeancesProches,
    }
  }, [])

  if (!stats) {
    return <p className="text-sm text-muted">Chargement...</p>
  }

  const cards = [
    { label: 'Total élèves', value: stats.totalEleves, icon: Users, color: 'text-primary bg-blue-50' },
    { label: 'Classes actives', value: stats.totalClasses, icon: School, color: 'text-accent bg-violet-50' },
    {
      label: 'Encaissements du mois',
      value: formatFCFA(stats.encaissementsMois),
      icon: Wallet,
      color: 'text-success bg-emerald-50',
    },
    {
      label: "Absences aujourd'hui",
      value: stats.absencesAujourdhui,
      icon: CalendarX,
      color: 'text-danger bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link href="/admin/classes" className="btn-primary">
            <Plus size={16} /> Nouvelle absence
          </Link>
          <Link href="/admin/paiements" className="btn-secondary">
            <Plus size={16} /> Nouveau versement
          </Link>
          <Link href="/admin/eleves" className="btn-secondary">
            <Plus size={16} /> Ajouter élève
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-card ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-xl font-semibold text-text">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Absences récentes (7 derniers jours)</h2>
          {stats.absencesRecentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune absence récente</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.absencesRecentes.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {a.prenom} {a.nom} <span className="text-muted">— {a.classe_nom}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted">
                    {a.date_absence}
                    <span className={`badge ${a.justifiee ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Échéances à venir (14 jours)</h2>
          {stats.echeancesProches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune échéance proche</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.echeancesProches.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{p.prenom} {p.nom}</span>
                  <span className="text-muted">
                    {formatFCFA(p.montant_du - p.montant_paye)} restant — {p.date_echeance}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
