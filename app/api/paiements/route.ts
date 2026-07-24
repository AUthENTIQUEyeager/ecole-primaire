import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Retourne toutes les tranches de paiement de tous les élèves actifs.
 * Utilisée uniquement pour alimenter le cache hors ligne (IndexedDB) —
 * permet d'enregistrer un versement pour n'importe quel élève même sans
 * avoir visité sa fiche au préalable.
 */
export async function GET() {
  const result = await db.execute(`
    SELECT p.* FROM paiements p
    JOIN eleves e ON e.id = p.eleve_id
    WHERE e.actif = 1
  `)
  return NextResponse.json(result.rows)
}
