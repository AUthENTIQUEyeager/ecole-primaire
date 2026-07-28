import { db } from '@/lib/db'

/**
 * Génère un matricule au format EC-[ANNÉE]-[4 chiffres].
 * Le compteur est basé sur le nombre d'élèves déjà créés pour l'année en cours.
 */
export async function genererMatricule(annee: string): Promise<string> {
  const year = annee.split('-')[0] // "2024-2025" -> "2024"
  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM eleves WHERE matricule LIKE ?`,
    args: [`EC-${year}-%`],
  })
  const count = Number(result.rows[0]?.count ?? 0)
  const next = String(count + 1).padStart(4, '0')
  return `EC-${year}-${next}`
}
