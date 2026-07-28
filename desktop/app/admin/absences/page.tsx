'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { AbsencesView } from '@/components/absences/AbsencesView'

export default function AbsencesPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [absences, classes, eleves] = await Promise.all([
      localDB.absences.toArray(),
      localDB.classes.toArray(),
      localDB.eleves.toArray(),
    ])
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const elevesById = new Map(eleves.map((e) => [e.id, e]))

    const absencesEnrichies = absences
      .map((a) => {
        const e = elevesById.get(a.eleve_id)
        const c = e ? classesById.get(e.classe_id) : undefined
        return { ...a, nom: e?.nom ?? '', prenom: e?.prenom ?? '', classe_nom: c?.nom ?? '' }
      })
      .sort((a, b) => (a.date_absence < b.date_absence ? 1 : -1))
      .slice(0, 200)

    const stats = classes
      .map((c) => ({
        nom: c.nom,
        total: absences.filter((a) => a.type === 'absence' && elevesById.get(a.eleve_id)?.classe_id === c.id).length,
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom))

    return { absences: absencesEnrichies, classes: classes.map((c) => ({ id: c.id, nom: c.nom })), stats }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Absences</h1>
      <AbsencesView absences={data.absences as any} classes={data.classes} stats={data.stats} />
    </div>
  )
}
