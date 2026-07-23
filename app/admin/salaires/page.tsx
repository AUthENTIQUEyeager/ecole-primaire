import { db } from '@/lib/db'
import { SalairesView } from '@/components/salaires/SalairesView'

export const dynamic = 'force-dynamic'

export default async function SalairesPage() {
  const moisActuel = new Date().toISOString().slice(0, 7)
  const result = await db.execute(`SELECT * FROM salaires ORDER BY mois DESC, enseignant_nom`)

  const resume = await db.execute({
    sql: `SELECT
      COALESCE(SUM(salaire_net), 0) as masse,
      SUM(CASE WHEN statut = 'paye' THEN 1 ELSE 0 END) as payes,
      SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente
      FROM salaires WHERE mois = ?`,
    args: [moisActuel],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Salaires</h1>
      <SalairesView salaires={result.rows as any[]} resume={resume.rows[0] as any} moisActuel={moisActuel} />
    </div>
  )
}
