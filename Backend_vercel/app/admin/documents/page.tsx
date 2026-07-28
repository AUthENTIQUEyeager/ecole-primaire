'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { DocumentsView } from '@/components/documents/DocumentsView'

export default function DocumentsPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [eleves, classes, configRows] = await Promise.all([
      localDB.eleves.where('actif').equals(1).toArray(),
      localDB.classes.toArray(),
      localDB.config.toArray(),
    ])
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const elevesEnrichis = eleves
      .map((e) => ({ ...e, classe_nom: classesById.get(e.classe_id)?.nom ?? '' }))
      .sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
    const config = Object.fromEntries(configRows.map((r) => [r.key, r.value]))
    return { eleves: elevesEnrichis, config }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Documents</h1>
      <DocumentsView eleves={data.eleves as any[]} config={data.config} />
    </div>
  )
}
