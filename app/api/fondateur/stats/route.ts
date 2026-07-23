import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { cached } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const stats = await cached('fondateur:stats', 300, async () => {
    const [encaisse, depenses, effectifTotal, parClasse, salairesEnAttente, annonces, activite, retards] =
      await Promise.all([
        db.execute(`SELECT COALESCE(SUM(montant),0) as total FROM versements
                     WHERE strftime('%Y-%m', date_versement) = strftime('%Y-%m','now')`),
        db.execute(`SELECT COALESCE(SUM(montant),0) as total FROM depenses
                     WHERE strftime('%Y-%m', date_depense) = strftime('%Y-%m','now')`),
        db.execute(`SELECT COUNT(*) as n FROM eleves WHERE actif = 1`),
        db.execute(`SELECT c.nom, COUNT(e.id) as n FROM classes c
                     LEFT JOIN eleves e ON e.classe_id = c.id AND e.actif = 1
                     GROUP BY c.id ORDER BY c.nom`),
        db.execute(`SELECT COUNT(*) as n FROM salaires
                     WHERE statut = 'en_attente' AND mois = strftime('%Y-%m','now')`),
        db.execute(`SELECT * FROM annonces ORDER BY created_at DESC LIMIT 5`),
        db.execute(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10`),
        db.execute(`SELECT e.nom, e.prenom FROM paiements p JOIN eleves e ON e.id = p.eleve_id
                     WHERE p.statut = 'en_retard_total'`),
      ])

    const elevesAJour = await db.execute(`
      SELECT COUNT(DISTINCT eleve_id) as n FROM paiements
      WHERE eleve_id NOT IN (SELECT eleve_id FROM paiements WHERE statut != 'soldee')
    `)
    const totalEleves = Number(effectifTotal.rows[0]?.n ?? 0)
    const aJour = Number(elevesAJour.rows[0]?.n ?? 0)

    return {
      encaisseMois: Number(encaisse.rows[0]?.total ?? 0),
      depensesMois: Number(depenses.rows[0]?.total ?? 0),
      effectifTotal: totalEleves,
      parClasse: parClasse.rows,
      elevesAJour: aJour,
      elevesEnRetard: totalEleves - aJour,
      tauxRecouvrement: totalEleves > 0 ? Math.round((aJour / totalEleves) * 100) : 0,
      salairesEnAttente: Number(salairesEnAttente.rows[0]?.n ?? 0),
      annonces: annonces.rows,
      activiteRecente: activite.rows,
      elevesRetardTotal: retards.rows,
    }
  })

  return NextResponse.json(stats)
}
