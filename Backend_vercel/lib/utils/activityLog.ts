import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { invalidate } from '@/lib/redis'

/**
 * Ajoute une entrée à la journal d'activité (append-only), visible sur
 * le dashboard fondateur. Invalide le cache des stats fondateur.
 */
export async function ajouterActivite(actionType: string, descriptionFr: string) {
  await db.execute({
    sql: `INSERT INTO activity_log (id, action_type, description_fr, created_at)
          VALUES (?, ?, ?, datetime('now'))`,
    args: [randomUUID(), actionType, descriptionFr],
  })
  await invalidate('fondateur:stats')
}
