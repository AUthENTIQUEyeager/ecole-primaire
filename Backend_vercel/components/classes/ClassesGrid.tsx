'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { School, Users, Pencil, Save, X } from 'lucide-react'
import { classeRepo } from '@/lib/localdb/repo'

interface Classe {
  id: string
  nom: string
  effectif: number
  enseignant_principal?: string
}

// `classes` vient d'une requête Dexie réactive dans la page parente : toute
// écriture (via classeRepo) met à jour la grille automatiquement.
export function ClassesGrid({ classes }: { classes: Classe[] }) {
  const router = useRouter()
  const [editionId, setEditionId] = useState<string | null>(null)
  const [enseignant, setEnseignant] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  function commencerEdition(c: Classe) {
    setEditionId(c.id)
    setEnseignant(c.enseignant_principal ?? '')
  }

  async function enregistrer(id: string) {
    setEditionId(null)
    const res = await classeRepo.updateEnseignant(id, enseignant || undefined)
    setErreur(res.error ? "Échec de l'enregistrement." : null)
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
