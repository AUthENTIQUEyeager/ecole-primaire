'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { School, Users, Pencil, Save, X } from 'lucide-react'
import { mutate } from '@/lib/sync/syncManager'

interface Classe {
  id: string
  nom: string
  effectif: number
  enseignant_principal?: string
}

export function ClassesGrid({ classes: classesInitiales }: { classes: Classe[] }) {
  const router = useRouter()
  const [classes, setClasses] = useState(classesInitiales)
  const [editionId, setEditionId] = useState<string | null>(null)
  const [enseignant, setEnseignant] = useState('')
  const [enAttenteIds, setEnAttenteIds] = useState<Set<string>>(new Set())
  const [erreur, setErreur] = useState<string | null>(null)

  function commencerEdition(c: Classe) {
    setEditionId(c.id)
    setEnseignant(c.enseignant_principal ?? '')
  }

  async function enregistrer(id: string) {
    const ancien = classes.find((c) => c.id === id)?.enseignant_principal
    // Optimiste : la carte reflète le changement tout de suite.
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, enseignant_principal: enseignant || undefined } : c)))
    setEditionId(null)

    const res = await mutate({
      endpoint: `/api/classes/${id}`,
      method: 'PUT',
      operation: 'UPDATE',
      payload: { enseignant_principal: enseignant || undefined },
    })

    if (res?.error) {
      setErreur("Échec de l'enregistrement — enseignant remis à sa valeur précédente.")
      setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, enseignant_principal: ancien } : c)))
      return
    }
    setErreur(null)
    if (res?.queued) {
      setEnAttenteIds((prev) => new Set(prev).add(id))
    }
  }

  return (
    <div className="space-y-3">
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
        <div key={c.id} className="card flex items-center gap-4 p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-blue-50 text-primary cursor-pointer"
            onClick={() => router.push(`/admin/classes/${c.id}`)}
          >
            <School size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="cursor-pointer font-semibold text-text hover:text-primary"
              onClick={() => router.push(`/admin/classes/${c.id}`)}
            >
              {c.nom}
            </p>
            <p className="flex items-center gap-1 text-sm text-muted">
              <Users size={14} /> {c.effectif} élève(s)
            </p>
            {editionId === c.id ? (
              <div className="mt-2 flex items-center gap-1">
                <input
                  className="input-field h-8 text-sm"
                  placeholder="Nom de l'enseignant principal"
                  value={enseignant}
                  onChange={(e) => setEnseignant(e.target.value)}
                  autoFocus
                />
                <button className="rounded-input p-1.5 text-primary hover:bg-blue-50" onClick={() => enregistrer(c.id)}>
                  <Save size={14} />
                </button>
                <button className="rounded-input p-1.5 text-muted hover:bg-slate-50" onClick={() => setEditionId(null)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1">
                <p className="text-sm text-muted">
                  {c.enseignant_principal || 'Enseignant principal non renseigné'}
                </p>
                {enAttenteIds.has(c.id) && <span className="badge bg-amber-100 text-amber-700">en attente</span>}
                <button
                  className="rounded-input p-1 text-muted hover:bg-slate-50 hover:text-primary"
                  onClick={() => commencerEdition(c)}
                  title="Modifier l'enseignant"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
