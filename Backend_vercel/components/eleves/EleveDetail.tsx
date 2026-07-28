'use client'

import { useState } from 'react'
import { User, Wallet, Printer, Pencil } from 'lucide-react'
import { LABELS_STATUT, COULEURS_STATUT, formatFCFA, type StatutPaiement } from '@/lib/utils/paiement'
import { VersementModal } from '@/components/paiements/VersementModal'
import { EleveForm } from './EleveForm'

interface EleveDetailProps {
  eleve: any
  paiements: any[]
  versements: any[]
  absences: any[]
  notes: any[]
  classes: { id: string; nom: string }[]
}

const TABS = ['profil', 'notes', 'absences', 'paiements'] as const
type Tab = (typeof TABS)[number]

// Toutes les données (eleve, paiements, versements...) viennent d'une requête
// Dexie réactive dans la page parente : un versement ou une modification se
// reflète ici automatiquement, sans état local dupliqué ni callback manuel.
export function EleveDetail({ eleve, paiements, versements, absences, notes, classes }: EleveDetailProps) {
  const [tab, setTab] = useState<Tab>('profil')
  const [modalOuvert, setModalOuvert] = useState(false)
  const [formOuvert, setFormOuvert] = useState(false)

  const statutGlobal: StatutPaiement = paiements.find((p) => p.statut !== 'soldee')?.statut ?? 'soldee'

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-primary">
            {eleve.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={eleve.photo_url} alt="Photo" className="h-full w-full object-cover" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text">{eleve.prenom} {eleve.nom}</h1>
            <p className="text-sm text-muted">
              {eleve.matricule} — {eleve.classe_nom} — Parent : {eleve.nom_parent} ({eleve.whatsapp_parent})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setFormOuvert(true)}>
            <Pencil size={14} /> Modifier
          </button>
          <span className={`badge ${COULEURS_STATUT[statutGlobal]}`}>{LABELS_STATUT[statutGlobal]}</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <div className="card grid grid-cols-2 gap-4 p-5 text-sm">
          <div><span className="text-muted">Sexe</span><p className="font-medium text-text">{eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</p></div>
          <div><span className="text-muted">Date de naissance</span><p className="font-medium text-text">{eleve.date_naissance}</p></div>
          <div><span className="text-muted">Lieu de naissance</span><p className="font-medium text-text">{eleve.lieu_naissance || '—'}</p></div>
          <div><span className="text-muted">Statut médical</span><p className="font-medium text-text">{eleve.statut_medical ?? 'Non renseigné'}</p></div>
          <div><span className="text-muted">Téléphone parent</span><p className="font-medium text-text">{eleve.telephone_parent || '—'}</p></div>
          <div><span className="text-muted">Année scolaire</span><p className="font-medium text-text">{eleve.annee_scolaire}</p></div>
          <div className="col-span-2 pt-2">
            <button className="btn-secondary"><Printer size={16} /> Imprimer la carte scolaire</button>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Matière</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium">Période</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notes.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-2 text-text">{n.matiere_nom}</td>
                  <td className="px-4 py-2 text-muted capitalize">{n.type}</td>
                  <td className="px-4 py-2 font-medium text-text">{n.valeur}/{n.note_sur}</td>
                  <td className="px-4 py-2 text-muted">{n.periode}</td>
                  <td className="px-4 py-2 text-muted">{n.date_evaluation}</td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucune note enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'absences' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Justifiée</th>
                <th className="px-4 py-2 font-medium">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {absences.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-text">{a.date_absence}</td>
                  <td className="px-4 py-2 text-muted capitalize">{a.type}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${a.justifiee ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {a.justifiee ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">{a.motif || '—'}</td>
                </tr>
              ))}
              {absences.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Aucune absence enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'paiements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {paiements.map((p) => {
              const pct = p.montant_du > 0 ? Math.min(100, Math.round((p.montant_paye / p.montant_du) * 100)) : 0
              return (
                <div key={p.id} className="card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text">Tranche {p.tranche}</span>
                    <span className={`badge ${COULEURS_STATUT[p.statut as StatutPaiement]}`}>
                      {LABELS_STATUT[p.statut as StatutPaiement]}
                    </span>
                  </div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted">
                    {formatFCFA(p.montant_paye)} / {formatFCFA(p.montant_du)} — échéance {p.date_echeance}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end">
            <button className="btn-primary" onClick={() => setModalOuvert(true)}>
              <Wallet size={16} /> Enregistrer un versement
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Reçu</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Mode</th>
                  <th className="px-4 py-2 font-medium">Caissier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {versements.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 text-text">{v.numero_recu}</td>
                    <td className="px-4 py-2 text-muted">{v.date_versement}</td>
                    <td className="px-4 py-2 font-medium text-text">{formatFCFA(v.montant)}</td>
                    <td className="px-4 py-2 text-muted capitalize">{v.mode_paiement.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-muted">{v.caissier_nom}</td>
                  </tr>
                ))}
                {versements.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucun versement enregistré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOuvert && (
        <EleveForm
          classes={classes}
          eleve={eleve}
          onClose={() => setFormOuvert(false)}
          onSuccess={() => setFormOuvert(false)}
        />
      )}

      {modalOuvert && (
        <VersementModal
          eleveId={eleve.id}
          eleveNom={`${eleve.prenom} ${eleve.nom}`}
          tranches={paiements}
          onClose={() => setModalOuvert(false)}
          onSuccess={() => setModalOuvert(false)}
        />
      )}
    </div>
  )
}
