'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, Wallet, TrendingDown, Users, AlertTriangle, Megaphone, Activity } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/paiement'

interface Stats {
  encaisseMois: number
  depensesMois: number
  effectifTotal: number
  parClasse: { nom: string; n: number }[]
  elevesAJour: number
  elevesEnRetard: number
  tauxRecouvrement: number
  salairesEnAttente: number
  annonces: any[]
  activiteRecente: any[]
  elevesRetardTotal: { nom: string; prenom: string }[]
}

export function FondateurDashboard({ stats }: { stats: Stats }) {
  const { data: session } = useSession()
  const solde = stats.encaisseMois - stats.depensesMois

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-text">Tableau de bord — Fondateur</h1>
          <p className="text-sm text-muted">Bienvenue, {session?.user?.name}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1 rounded-input px-2 py-1.5 text-sm text-muted hover:bg-slate-50 hover:text-danger"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Santé financière */}
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text">Santé financière</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="flex items-center gap-1 text-xs text-muted"><Wallet size={12} /> Encaissé ce mois</p>
              <p className="text-lg font-semibold text-success">{formatFCFA(stats.encaisseMois)}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-muted"><TrendingDown size={12} /> Dépenses ce mois</p>
              <p className="text-lg font-semibold text-danger">{formatFCFA(stats.depensesMois)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Solde net</p>
              <p className={`text-lg font-semibold ${solde >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatFCFA(solde)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Taux de recouvrement</p>
              <p className="text-lg font-semibold text-text">{stats.tauxRecouvrement}%</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-primary" style={{ width: `${stats.tauxRecouvrement}%` }} />
              </div>
            </div>
          </div>
          {stats.salairesEnAttente > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-input bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle size={14} />
              {stats.salairesEnAttente} enseignant(s) non payé(s) ce mois
            </div>
          )}
        </section>

        {/* Effectifs */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <Users size={16} /> Effectifs
          </h2>
          <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted">Total actifs</p><p className="font-semibold text-text">{stats.effectifTotal}</p></div>
            <div><p className="text-muted">À jour</p><p className="font-semibold text-success">{stats.elevesAJour}</p></div>
            <div><p className="text-muted">En retard</p><p className="font-semibold text-danger">{stats.elevesEnRetard}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {stats.parClasse.map((c) => (
              <div key={c.nom} className="rounded-input border border-border p-2 text-center">
                <p className="text-xs text-muted">{c.nom}</p>
                <p className="font-semibold text-text">{c.n}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Annonces */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
              <Megaphone size={16} /> Annonces récentes
            </h2>
            <ul className="space-y-2">
              {stats.annonces.map((a) => (
                <li key={a.id} className="rounded-input border border-border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">{a.titre}</span>
                    <span className="badge bg-slate-100 text-slate-600">{a.priorite}</span>
                  </div>
                  <p className="text-xs text-muted">{a.date_debut}</p>
                </li>
              ))}
              {stats.annonces.length === 0 && <p className="text-sm text-muted">Aucune annonce.</p>}
            </ul>
          </section>

          {/* Activité récente */}
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
              <Activity size={16} /> Activité récente
            </h2>
            <ul className="space-y-2 text-sm">
              {stats.activiteRecente.map((a) => (
                <li key={a.id} className="border-b border-border pb-2 text-text last:border-0">
                  {a.description_fr}
                  <p className="text-xs text-muted">{a.created_at}</p>
                </li>
              ))}
              {stats.activiteRecente.length === 0 && <p className="text-sm text-muted">Aucune activité récente.</p>}
            </ul>
          </section>
        </div>

        {/* Alertes */}
        {stats.elevesRetardTotal.length > 0 && (
          <section className="card border-red-200 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
              <AlertTriangle size={16} /> Alertes — retard total de paiement
            </h2>
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {stats.elevesRetardTotal.map((e, i) => (
                <li key={i} className="rounded-input bg-red-50 px-3 py-1.5 text-red-700">
                  {e.prenom} {e.nom}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
