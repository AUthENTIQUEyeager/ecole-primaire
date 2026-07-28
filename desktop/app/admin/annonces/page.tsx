'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { AnnoncesView } from '@/components/annonces/AnnoncesView'

export default function AnnoncesPage() {
  const annonces = useLiveQuery(async () => {
    if (!localDB) return null
    const liste = await localDB.annonces.toArray()
    return liste.sort((a, b) => (a.date_debut < b.date_debut ? 1 : -1))
  }, [])

  if (!annonces) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Annonces</h1>
      <AnnoncesView annonces={annonces as any[]} />
    </div>
  )
}
