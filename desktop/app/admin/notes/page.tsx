'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { NotesPageClient } from '@/components/notes/NotesPageClient'

export default function NotesPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [classes, matieres] = await Promise.all([localDB.classes.toArray(), localDB.matieres.toArray()])
    return {
      classes: classes.map((c) => ({ id: c.id, nom: c.nom })).sort((a, b) => a.nom.localeCompare(b.nom)),
      matieres: matieres
        .map((m) => ({ id: m.id, nom: m.nom, coefficient: m.coefficient }))
        .sort((a, b) => a.nom.localeCompare(b.nom)),
    }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Notes & Bulletins</h1>
      <NotesPageClient classes={data.classes} matieres={data.matieres} />
    </div>
  )
}
