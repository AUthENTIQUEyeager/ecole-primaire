import { db } from '@/lib/db'
import { EleveTable } from '@/components/eleves/EleveTable'

export const dynamic = 'force-dynamic'

async function getData() {
  const [eleves, classes] = await Promise.all([
    db.execute(`
      SELECT e.id, e.nom, e.prenom, e.sexe, e.whatsapp_parent, e.statut_medical, c.nom as classe_nom,
        (SELECT statut FROM paiements p WHERE p.eleve_id = e.id AND p.statut != 'soldee'
          ORDER BY CASE statut WHEN 'en_retard_total' THEN 1 WHEN 'en_retard_partiel' THEN 2
          WHEN 'en_cours' THEN 3 WHEN 'en_attente' THEN 4 END LIMIT 1) as statut_paiement,
        (SELECT COALESCE(SUM(montant_du),0) FROM paiements p WHERE p.eleve_id = e.id) as montant_du_total,
        (SELECT COALESCE(SUM(montant_paye),0) FROM paiements p WHERE p.eleve_id = e.id) as montant_paye_total
      FROM eleves e
      JOIN classes c ON c.id = e.classe_id
      WHERE e.actif = 1
      ORDER BY e.nom, e.prenom
    `),
    db.execute(`SELECT id, nom FROM classes ORDER BY nom`),
  ])

  return {
    eleves: eleves.rows.map((r) => ({ ...r, statut_paiement: r.statut_paiement ?? 'soldee' })) as any[],
    classes: classes.rows as any[],
  }
}

export default async function ElevesPage() {
  const { eleves, classes } = await getData()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Élèves</h1>
      <EleveTable eleves={eleves} classes={classes} />
    </div>
  )
}
