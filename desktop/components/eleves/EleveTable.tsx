'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, User } from 'lucide-react'
import { LABELS_STATUT, COULEURS_STATUT, formatFCFA, type StatutPaiement } from '@/lib/utils/paiement'
import { EleveForm } from './EleveForm'

interface EleveRow {
  id: string
  nom: string
  prenom: string
  classe_nom: string
  whatsapp_parent: string
  statut_paiement: StatutPaiement
  statut_medical?: string
  sexe: string
  montant_du_total?: number
  montant_paye_total?: number
}

interface Classe {
  id: string
  nom: string
}

// Les données viennent directement d'une requête Dexie réactive (useLiveQuery
// dans la page parente) : toute écriture locale (ajout, édition) met à jour
// `eleves` automatiquement, sans état local dupliqué ici.
export function EleveTable({ eleves, classes }: { eleves: EleveRow[]; classes: Classe[] }) {
  const router = useRouter()
  const [recherche, setRecherche] = useState('')
  const [classeFiltre, setClasseFiltre] = useState('')
  const [afficherForm, setAfficherForm] = useState(false)

  const filtres = useMemo(() => {
    return eleves.filter((e) => {
      const matchRecherche =
        !recherche || `${e.prenom} ${e.nom}`.toLowerCase().includes(recherche.toLowerCase())
      const matchClasse = !classeFiltre || e.classe_nom === classeFiltre
      return matchRecherche && matchClasse
    })
  }, [eleves, recherche, classeFiltre])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-muted" />
            <input
              className="input-field pl-9"
              placeholder="Rechercher un élève..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <select className="input-field w-auto" value={classeFiltre} onChange={(e) => setClasseFiltre(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setAfficherForm(true)}>
          <Plus size={16} /> Ajouter élève
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Élève</th>
              <th className="px-4 py-2 font-medium">Reste à payer</th>
              <th className="px-4 py-2 font-medium">Classe</th>
              <th className="px-4 py-2 font-medium">WhatsApp parent</th>
              <th className="px-4 py-2 font-medium">Paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtres.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => router.push(`/admin/eleves/detail?id=${e.id}`)}
              >
                <td className="flex items-center gap-2 px-4 py-2 font-medium text-text">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-primary">
                    <User size={14} />
                  </div>
                  {e.prenom} {e.nom}
                </td>
                <td className="px-4 py-2 text-text">
                  {(() => {
                    const reste = (e.montant_du_total ?? 0) - (e.montant_paye_total ?? 0)
                    return reste > 0 ? formatFCFA(reste) : '—'
                  })()}
                </td>
                <td className="px-4 py-2 text-muted">{e.classe_nom}</td>
                <td className="px-4 py-2 text-muted">{e.whatsapp_parent}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${COULEURS_STATUT[e.statut_paiement] ?? ''}`}>
                    {LABELS_STATUT[e.statut_paiement] ?? e.statut_paiement}
                  </span>
                </td>
              </tr>
            ))}
            {filtres.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Aucun élève ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {afficherForm && (
        <EleveForm
          classes={classes}
          onClose={() => setAfficherForm(false)}
          onSuccess={() => setAfficherForm(false)}
        />
      )}
    </div>
  )
}
