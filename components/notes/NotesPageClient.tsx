'use client'

import { useState, useEffect } from 'react'
import { NoteGrid } from './NoteGrid'

interface Classe { id: string; nom: string }
interface Matiere { id: string; nom: string; coefficient: number }

export function NotesPageClient({ classes, matieres }: { classes: Classe[]; matieres: Matiere[] }) {
  const [classeId, setClasseId] = useState(classes[0]?.id ?? '')
  const [periode, setPeriode] = useState<'T1' | 'T2' | 'T3'>('T1')
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    if (!classeId) return
    setChargement(true)
    fetch(`/api/classes/${classeId}`)
      .then((r) => r.json())
      .then((data) => setEleves(data.eleves ?? []))
      .finally(() => setChargement(false))
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

      {chargement ? (
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
