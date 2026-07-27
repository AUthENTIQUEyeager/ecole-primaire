'use client'

import { useState, useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
import { versementRepo } from '@/lib/localdb/repo'
import { formatFCFA, type StatutPaiement } from '@/lib/utils/paiement'

export interface TrancheInfo {
  id: string
  tranche: number
  montant_du: number
  montant_paye: number
  date_echeance: string
  statut: StatutPaiement
}

interface VersementModalProps {
  eleveId: string
  eleveNom: string
  tranches: TrancheInfo[]
  onClose: () => void
  // La répartition/débordement sur les tranches est calculée et écrite dans
  // Dexie par versementRepo — la fiche élève se met à jour toute seule via
  // sa requête réactive. onSuccess ne sert qu'à fermer la fenêtre.
  onSuccess: () => void
}

export function VersementModal({ eleveId, eleveNom, tranches, onClose, onSuccess }: VersementModalProps) {
  const tranchesImpayees = useMemo(
    () => [...tranches].filter((t) => t.statut !== 'soldee').sort((a, b) => a.tranche - b.tranche),
    [tranches]
  )
  const [trancheChoisie, setTrancheChoisie] = useState<number>(tranchesImpayees[0]?.tranche ?? 1)
  const [montant, setMontant] = useState('')
  const [mode, setMode] = useState<'especes' | 'mobile_money' | 'cheque'>('especes')
  const [caissier, setCaissier] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  const trancheActuelle = tranchesImpayees.find((t) => t.tranche === trancheChoisie)
  const resteTranche = trancheActuelle ? trancheActuelle.montant_du - trancheActuelle.montant_paye : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const montantNum = parseInt(montant, 10)
    if (!montantNum || montantNum <= 0) {
      setErreur('Montant invalide')
      return
    }
    if (!caissier.trim()) {
      setErreur('Le nom du caissier est requis')
      return
    }

    setChargement(true)
    const res = await versementRepo.create({
      eleve_id: eleveId,
      montant: montantNum,
      date_versement: new Date().toISOString().slice(0, 10),
      mode_paiement: mode,
      caissier_nom: caissier,
      tranche_depart: trancheChoisie,
    })
    setChargement(false)

    if (res?.error) {
      setErreur("Erreur lors de l'enregistrement. Réessayez.")
      return
    }
    onSuccess()
  }

  if (tranchesImpayees.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-[420px] rounded-modal bg-surface p-6 shadow-lg text-center">
          <p className="mb-4 text-sm text-text">Toutes les tranches de {eleveNom} sont déjà soldées.</p>
          <button onClick={onClose} className="btn-secondary">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[520px] rounded-modal bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Enregistrer un versement</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted">
          Élève : <span className="font-medium text-text">{eleveNom}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Tranche</label>
            <select
              className="input-field"
              value={trancheChoisie}
              onChange={(e) => setTrancheChoisie(Number(e.target.value))}
            >
              {tranchesImpayees.map((t) => (
                <option key={t.tranche} value={t.tranche}>
                  Tranche {t.tranche} — reste {formatFCFA(t.montant_du - t.montant_paye)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Montant versé (FCFA)</label>
            <input
              type="number"
              inputMode="numeric"
              className="input-field"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder={`Ex : ${resteTranche}`}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted">
              Un montant supérieur au reste dû sur la tranche {trancheChoisie} est automatiquement
              reporté sur la tranche suivante.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {(['especes', 'mobile_money', 'cheque'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-input border px-3 py-2 text-sm ${
                    mode === m ? 'border-primary bg-blue-50 text-primary' : 'border-border text-text'
                  }`}
                >
                  {m === 'especes' ? 'Espèces' : m === 'mobile_money' ? 'Mobile Money' : 'Chèque'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Caissier</label>
            <input
              type="text"
              className="input-field"
              value={caissier}
              onChange={(e) => setCaissier(e.target.value)}
              placeholder="Nom du caissier"
            />
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={chargement} className="btn-primary">
              {chargement ? <Loader2 size={16} className="animate-spin" /> : null}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
