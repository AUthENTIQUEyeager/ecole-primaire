import { db } from '@/lib/db'
import { DepensesView } from '@/components/depenses/DepensesView'

export const dynamic = 'force-dynamic'

export default async function DepensesPage() {
  const [depenses, totalMois] = await Promise.all([
    db.execute(`SELECT * FROM depenses ORDER BY date_depense DESC`),
    db.execute(`SELECT categorie, COALESCE(SUM(montant),0) as total FROM depenses
                WHERE strftime('%Y-%m', date_depense) = strftime('%Y-%m','now')
                GROUP BY categorie`),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Dépenses</h1>
      <DepensesView depenses={depenses.rows as any[]} totalParCategorie={totalMois.rows as any[]} />
    </div>
  )
}
