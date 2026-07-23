'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Wallet, MessageCircle, Loader2 } from 'lucide-react'
import { LABELS_STATUT, COULEURS_STATUT, formatFCFA, type StatutPaiement } from '@/lib/utils/paiement'
import { VersementModal } from './VersementModal'

interface ElevePaiement {
  id: string
  nom: string
  prenom: string
  classe_nom: string
  whatsapp_parent: string
  nom_parent: string
  statut_paiement: StatutPaiement
  montant_du_total?: number
  montant_paye_total?: number
}

export function PaiementsView({ eleves: elevesInitial }: { eleves: ElevePaiement[] }) {
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<StatutPaiement | 'tous'>('tous')
  const [modalEleve, setModalEleve] = useState<ElevePaiement | null>(null)
  const [tranchesModal, setTranchesModal] = useState<any[] | null>(null)
  const [chargementModal, setChargementModal] = useState<string | null>(null)
  const [vueRappel, setVueRappel] = useState(false)

  const eleves = useMemo(() => {
    return elevesInitial.filter((e) => {
      const matchRecherche =
        !recherche ||
        `${e.prenom} ${e.nom}`.toLowerCase().includes(recherche.toLowerCase())
      const matchStatut = filtreStatut === 'tous' || e.statut_paiement === filtreStatut
      return matchRecherche && matchStatut
    })
  }, [elevesInitial, recherche, filtreStatut])

  const enRetard = elevesInitial.filter(
    (e) => e.statut_paiement === 'en_retard_partiel' || e.statut_paiement === 'en_retard_total'
  )

  async function ouvrirVersement(e: ElevePaiement) {
    setChargementModal(e.id)
    const res = await fetch(`/api/eleves/${e.id}/paiements`)
    const data = await res.json()
    setChargementModal(null)
    setTranchesModal(data.paiements ?? [])
    setModalEleve(e)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-muted" />
          <input
            className="input-field pl-9"
            placeholder="Rechercher un élève..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input-field w-auto"
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as any)}
          >
            <option value="tous">Tous les statuts</option>
            {Object.entries(LABELS_STATUT).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={() => setVueRappel((v) => !v)}>
            <MessageCircle size={16} /> Rappels ({enRetard.length})
          </button>
        </div>
      </div>

      {vueRappel && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">
            Élèves en retard — à copier pour rappel WhatsApp
          </h2>
          <div className="space-y-2">
            {enRetard.map((e) => (
              <div key={e.id} className="rounded-input border border-border bg-slate-50 p-3 text-sm">
                <p className="font-medium text-text">
                  {e.prenom} {e.nom} ({e.classe_nom}) — Parent : {e.nom_parent} — {e.whatsapp_parent}
                </p>
                <p className="mt-1 text-muted">
                  Bonjour {e.nom_parent}, nous vous rappelons que les frais de scolarité de {e.prenom}{' '}
                  {e.nom} sont en retard. Merci de régulariser dès que possible. École Primaire Privée Les Étoiles.
                </p>
              </div>
            ))}
            {enRetard.length === 0 && <p className="text-sm text-muted">Aucun élève en retard.</p>}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Élève</th>
              <th className="px-4 py-2 font-medium">Reste à payer</th>
              <th className="px-4 py-2 font-medium">Classe</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eleves.map((e) => {
              const reste = (e.montant_du_total ?? 0) - (e.montant_paye_total ?? 0)
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-text">{e.prenom} {e.nom}</td>
                  <td className="px-4 py-2 text-text">{reste > 0 ? formatFCFA(reste) : '—'}</td>
                  <td className="px-4 py-2 text-muted">{e.classe_nom}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${COULEURS_STATUT[e.statut_paiement] ?? ''}`}>
                      {LABELS_STATUT[e.statut_paiement] ?? e.statut_paiement}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button className="btn-secondary" onClick={() => ouvrirVersement(e)} disabled={chargementModal === e.id}>
                      {chargementModal === e.id ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                      Versement
                    </button>
                  </td>
                </tr>
              )
            })}
            {eleves.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Aucun élève ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalEleve && tranchesModal && (
        <VersementModal
          eleveId={modalEleve.id}
          eleveNom={`${modalEleve.prenom} ${modalEleve.nom}`}
          tranches={tranchesModal}
          onClose={() => { setModalEleve(null); setTranchesModal(null) }}
          onSuccess={() => { setModalEleve(null); setTranchesModal(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
