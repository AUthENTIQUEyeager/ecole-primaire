import Link from 'next/link'
import { Users, School, Wallet, CalendarX, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { formatFCFA } from '@/lib/utils/paiement'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [eleves, classes, absences, encaissements] = await Promise.all([
    db.execute(`SELECT COUNT(*) as n FROM eleves WHERE actif = 1`),
    db.execute(`SELECT COUNT(*) as n FROM classes`),
    db.execute(`SELECT COUNT(*) as n FROM absences WHERE date_absence = date('now')`),
    db.execute(`SELECT COALESCE(SUM(montant), 0) as total FROM versements
                WHERE strftime('%Y-%m', date_versement) = strftime('%Y-%m', 'now')`),
  ])

  const absencesRecentes = await db.execute(`
    SELECT a.id, a.date_absence, a.type, a.justifiee, e.nom, e.prenom, c.nom as classe_nom
    FROM absences a
    JOIN eleves e ON e.id = a.eleve_id
    JOIN classes c ON c.id = e.classe_id
    WHERE a.date_absence >= date('now', '-7 days')
    ORDER BY a.date_absence DESC LIMIT 8
  `)

  const echeancesProches = await db.execute(`
    SELECT p.id, p.date_echeance, p.montant_du, p.montant_paye, e.nom, e.prenom
    FROM paiements p
    JOIN eleves e ON e.id = p.eleve_id
    WHERE p.statut != 'soldee' AND p.date_echeance <= date('now', '+14 days')
    ORDER BY p.date_echeance ASC LIMIT 8
  `)

  return {
    totalEleves: Number(eleves.rows[0]?.n ?? 0),
    totalClasses: Number(classes.rows[0]?.n ?? 0),
    absencesAujourdhui: Number(absences.rows[0]?.n ?? 0),
    encaissementsMois: Number(encaissements.rows[0]?.total ?? 0),
    absencesRecentes: absencesRecentes.rows,
    echeancesProches: echeancesProches.rows,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

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
