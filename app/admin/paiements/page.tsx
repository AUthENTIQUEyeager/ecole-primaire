import { db } from '@/lib/db'
import { PaiementsView } from '@/components/paiements/PaiementsView'

export const dynamic = 'force-dynamic'

async function getElevesAvecPaiements() {
  const result = await db.execute(`
    SELECT e.id, e.nom, e.prenom, e.whatsapp_parent, e.nom_parent, c.nom as classe_nom,
      COALESCE(SUM(p.montant_du), 0) as montant_du_total,
      COALESCE(SUM(p.montant_paye), 0) as montant_paye_total,
      (SELECT statut FROM paiements p2 WHERE p2.eleve_id = e.id AND p2.statut != 'soldee'
        ORDER BY CASE statut WHEN 'en_retard_total' THEN 1 WHEN 'en_retard_partiel' THEN 2
        WHEN 'en_cours' THEN 3 WHEN 'en_attente' THEN 4 END LIMIT 1) as statut_paiement
    FROM eleves e
    JOIN classes c ON c.id = e.classe_id
    LEFT JOIN paiements p ON p.eleve_id = e.id
    WHERE e.actif = 1
    GROUP BY e.id
    ORDER BY e.nom, e.prenom
  `)
  return result.rows.map((r) => ({
    ...r,
    statut_paiement: r.statut_paiement ?? 'soldee',
  })) as any[]
}

export default async function PaiementsPage() {
  const eleves = await getElevesAvecPaiements()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Paiements</h1>
      <PaiementsView eleves={eleves} />
    </div>
  )
}
