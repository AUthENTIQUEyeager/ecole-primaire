import { localDB, type QueueItem } from './indexedDB'
import { apiFetch } from '../apiConfig'

export function genererId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface MutationOptions {
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  payload: unknown
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
}

/**
 * Point d'entrée unique pour toute mutation (POST/PUT/DELETE), envoyée au
 * serveur distant (déploiement Vercel configuré à la connexion) via apiFetch.
 * - En ligne : envoie directement à l'API.
 * - Hors ligne : enregistre dans la file IndexedDB pour synchronisation ultérieure.
 */
export async function mutate({ endpoint, method, payload, operation }: MutationOptions) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  if (isOnline) {
    let res: Response
    try {
      res = await apiFetch(endpoint, { method, body: JSON.stringify(payload) })
    } catch {
      // fetch() lui-même a échoué (pas de réseau, DNS, etc.) — vraie
      // déconnexion malgré navigator.onLine : on met en file d'attente.
      await enqueue({ endpoint, method, payload, operation })
      return { queued: true }
    }

    if (res.ok) {
      return await res.json()
    }

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
    id: genererId(),
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
      const res = await apiFetch(item.endpoint, { method: item.method, body: JSON.stringify(item.payload) })
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
