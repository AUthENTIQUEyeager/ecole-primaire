import { randomUUID } from 'crypto'
import { localDB, type QueueItem } from './indexedDB'

interface MutationOptions {
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  payload: unknown
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
}

/**
 * Point d'entrée unique pour toute mutation (POST/PUT/DELETE).
 * - En ligne : envoie directement à l'API.
 * - Hors ligne : enregistre dans la file IndexedDB pour synchronisation ultérieure.
 */
export async function mutate({ endpoint, method, payload, operation }: MutationOptions) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  if (isOnline) {
    let res: Response
    try {
      res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // fetch() lui-même a échoué (pas de réseau, DNS, etc.) — vraie
      // déconnexion malgré navigator.onLine : on met en file d'attente.
      await enqueue({ endpoint, method, payload, operation })
      return { queued: true }
    }

    if (res.ok) {
      return await res.json()
    }

    // Le serveur a répondu mais a refusé la requête (validation, droits,
    // charge utile trop grosse, etc.) — ce n'est PAS un problème de
    // connectivité. Ne jamais mettre en file d'attente silencieusement ici :
    // l'utilisateur doit voir l'erreur immédiatement.
    let details: unknown = null
    try {
      details = await res.json()
    } catch {
      // corps de réponse non-JSON, on ignore
    }
    return { error: true, status: res.status, details }
  }

  await enqueue({ endpoint, method, payload, operation })
  return { queued: true }
}

async function enqueue({ endpoint, method, payload, operation }: MutationOptions) {
  if (!localDB) return
  const item: QueueItem = {
    id: randomUUID(),
    operation,
    endpoint,
    method,
    payload,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  await localDB.syncQueue.add(item)
}

/** Traite la file d'attente dans l'ordre (FIFO) lors de la reconnexion. */
export async function traiterFileSynchronisation(
  onProgress?: (restants: number) => void
): Promise<{ envoyes: number; echecs: number }> {
  if (!localDB) return { envoyes: 0, echecs: 0 }

  const enAttente = await localDB.syncQueue.where('status').equals('pending').sortBy('created_at')
  let envoyes = 0
  let echecs = 0

  for (const item of enAttente) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      if (!res.ok) throw new Error('Échec de synchronisation')
      await localDB.syncQueue.update(item.id, {
        status: 'synced',
        synced_at: new Date().toISOString(),
      })
      envoyes++
    } catch {
      await localDB.syncQueue.update(item.id, { status: 'failed' })
      echecs++
    }
    onProgress?.(enAttente.length - (envoyes + echecs))
  }

  return { envoyes, echecs }
}

export async function compterEnAttente(): Promise<number> {
  if (!localDB) return 0
  return localDB.syncQueue.where('status').equals('pending').count()
}
