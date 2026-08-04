'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { evenementVersementRepo } from '@/lib/localdb/repo'
import { formatFCFA } from '@/lib/utils/paiement'

interface CotisationVersementModalProps {
  cotisationId: string
  eleveId: string
  evenementId: string
  eleveNom: string
  montantDu: number
  montantPaye: number
  onClose: () => void
  onSuccess: () => void
}

export function CotisationVersementModal({
  cotisationId,
  eleveId,
  evenementId,
  eleveNom,
  montantDu,
  montantPaye,
  onClose,
  onSuccess,
}: CotisationVersementModalProps) {
  const reste = montantDu - montantPaye
  const [montant, setMontant] = useState('')
  const [mode, setMode] = useState<'especes' | 'mobile_money' | 'cheque'>('especes')
  const [caissier, setCaissier] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

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
    const res = await evenementVersementRepo.create({
      cotisation_id: cotisationId,
      eleve_id: eleveId,
      evenement_id: evenementId,
      montant: montantNum,
      date_versement: new Date().toISOString().slice(0, 10),
      mode_paiement: mode,
      caissier_nom: caissier,
    })
    setChargement(false)

    if (res?.error) {
      const detail =
        typeof res.details === 'string'
          ? res.details
          : res.details
            ? JSON.stringify(res.details)
            : null
      setErreur(
        `Erreur lors de l'enregistrement${res.status ? ` (${res.status})` : ''}${detail ? ` : ${detail}` : '. Réessayez.'}`
      )
      return
    }
    onSuccess()
  }

  if (reste <= 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-[420px] rounded-modal bg-surface p-6 shadow-lg text-center">
          <p className="mb-4 text-sm text-text">La cotisation de {eleveNom} est déjà entièrement réglée.</p>
          <button onClick={onClose} className="btn-secondary">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[480px] rounded-modal bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Enregistrer une cotisation</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted">
          Élève : <span className="font-medium text-text">{eleveNom}</span>
          {' — '}reste <span className="font-medium text-text">{formatFCFA(reste)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Montant versé (FCFA)</label>
            <input
              type="number"
              inputMode="numeric"
              className="input-field"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder={`Ex : ${reste}`}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted">
              Un montant partiel est accepté — le solde restant pourra être réglé plus tard.
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
