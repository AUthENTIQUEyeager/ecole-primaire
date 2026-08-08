'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { classeRepo } from '@/lib/localdb/repo'

const TOUTES_LES_CLASSES = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']

interface ClasseFormProps {
  /** Noms déjà utilisés — exclus des options pour éviter les doublons. */
  nomsExistants: string[]
  onClose: () => void
  onSuccess: () => void
}

export function ClasseForm({ nomsExistants, onClose, onSuccess }: ClasseFormProps) {
  const nomsDisponibles = TOUTES_LES_CLASSES.filter((n) => !nomsExistants.includes(n))

  const [nom, setNom] = useState(nomsDisponibles[0] ?? '')
  const [effectifMax, setEffectifMax] = useState('40')
  const [enseignant, setEnseignant] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom) return

    setChargement(true)
    const res = await classeRepo.create({
      nom,
      effectif_max: Number(effectifMax) || 40,
      enseignant_principal: enseignant || undefined,
    })
    setChargement(false)

    if (res?.error) {
      setErreur('Erreur lors de la création. Cette classe existe peut-être déjà.')
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-[420px] rounded-modal bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Ajouter une classe</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        {nomsDisponibles.length === 0 ? (
          <p className="text-sm text-muted">Les 6 classes (CP1 à CM2) existent déjà.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Classe</label>
              <select className="input-field" value={nom} onChange={(e) => setNom(e.target.value)}>
                {nomsDisponibles.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted">Effectif maximum</label>
              <input
                type="number"
                min={1}
                className="input-field"
                value={effectifMax}
                onChange={(e) => setEffectifMax(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted">Enseignant principal (optionnel)</label>
              <input
                className="input-field"
                placeholder="Nom de l'enseignant"
                value={enseignant}
                onChange={(e) => setEnseignant(e.target.value)}
              />
            </div>

            {erreur && <p className="text-sm text-danger">{erreur}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={chargement} className="btn-primary">
                {chargement ? <Loader2 size={14} className="animate-spin" /> : null}
                Créer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
