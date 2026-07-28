'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { NoteGrid } from './NoteGrid'

interface Classe { id: string; nom: string }
interface Matiere { id: string; nom: string; coefficient: number }

export function NotesPageClient({ classes, matieres }: { classes: Classe[]; matieres: Matiere[] }) {
  const [classeId, setClasseId] = useState(classes[0]?.id ?? '')
  const [periode, setPeriode] = useState<'T1' | 'T2' | 'T3'>('T1')

  // Lecture locale (Dexie) — plus de fetch réseau au changement de classe.
  const eleves = useLiveQuery(async () => {
    if (!localDB || !classeId) return []
    const liste = await localDB.eleves.where('classe_id').equals(classeId).and((e) => e.actif === 1).toArray()
    return liste
      .map((e) => ({ id: e.id, nom: e.nom, prenom: e.prenom }))
      .sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
  }, [classeId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="input-field w-auto" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={periode} onChange={(e) => setPeriode(e.target.value as any)}>
          <option value="T1">Trimestre 1</option>
          <option value="T2">Trimestre 2</option>
          <option value="T3">Trimestre 3</option>
        </select>
      </div>

      {!eleves ? (
        <p className="text-sm text-muted">Chargement...</p>
      ) : (
        <NoteGrid eleves={eleves} matieres={matieres} periode={periode} />
      )}

      <p className="text-xs text-muted">
        Pour générer les bulletins de cette classe, ouvrez la fiche de chaque élève (onglet Notes) une fois
        les notes du trimestre saisies — le bulletin calcule automatiquement moyenne et rang.
      </p>
    </div>
  )
}
