'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { notFound } from 'next/navigation'
import { localDB } from '@/lib/sync/indexedDB'
import { EleveDetail } from '@/components/eleves/EleveDetail'

export default function EleveDetailPage({ params }: { params: { id: string } }) {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [eleve, classes, paiements, versements, absences, notes, matieres] = await Promise.all([
      localDB.eleves.get(params.id),
      localDB.classes.toArray(),
      localDB.paiements.where('eleve_id').equals(params.id).toArray(),
      localDB.versements.where('eleve_id').equals(params.id).toArray(),
      localDB.absences.where('eleve_id').equals(params.id).toArray(),
      localDB.notes.where('eleve_id').equals(params.id).toArray(),
      localDB.matieres.toArray(),
    ])
    if (!eleve) return null
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const matieresById = new Map(matieres.map((m) => [m.id, m]))

    return {
      eleve: { ...eleve, classe_nom: classesById.get(eleve.classe_id)?.nom ?? '' },
      paiements: paiements.sort((a, b) => a.tranche - b.tranche),
      versements: versements.sort((a, b) => (a.date_versement < b.date_versement ? 1 : -1)),
      absences: absences.sort((a, b) => (a.date_absence < b.date_absence ? 1 : -1)),
      notes: notes
        .map((n) => ({ ...n, matiere_nom: matieresById.get(n.matiere_id)?.nom ?? '' }))
        .sort((a, b) => a.periode.localeCompare(b.periode) || a.matiere_nom.localeCompare(b.matiere_nom)),
      classes: classes.map((c) => ({ id: c.id, nom: c.nom })),
    }
  }, [params.id])

  if (data === null) notFound()
  if (data === undefined) return <p className="text-sm text-muted">Chargement...</p>

  return <EleveDetail {...data} />
}
