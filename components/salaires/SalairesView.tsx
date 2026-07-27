'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, Pencil, Save, X } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/paiement'
import { salaireRepo } from '@/lib/localdb/repo'

interface Salaire {
  id: string
  enseignant_nom: string
  matiere_principale?: string
  mois: string
  salaire_net: number
  statut: 'en_attente' | 'paye'
}

// `salaires` / `resume` viennent d'une requête Dexie réactive dans la page
// parente : ajout, modification et "marquer payé" se reflètent automatiquement.
export function SalairesView({
  salaires,
  resume,
  moisActuel,
}: {
  salaires: Salaire[]
  resume: { masse: number; payes: number; en_attente: number }
  moisActuel: string
}) {
  const [afficherForm, setAfficherForm] = useState(false)
  const [nom, setNom] = useState('')
  const [matiere, setMatiere] = useState('')
  const [montant, setMontant] = useState('')
  const [editionId, setEditionId] = useState<string | null>(null)
  const [editionForm, setEditionForm] = useState({ enseignant_nom: '', matiere_principale: '', salaire_net: '' })
  const [erreur, setErreur] = useState<string | null>(null)

  async function ajouter() {
    if (!nom || !montant) return
    const montantNum = parseInt(montant, 10)
    if (!montantNum) return

    setAfficherForm(false)
    const res = await salaireRepo.create({ enseignant_nom: nom, matiere_principale: matiere || undefined, mois: moisActuel, salaire_net: montantNum })

    if (res?.error) {
      setErreur("Échec de l'ajout de l'enseignant.")
      return
    }
    setErreur(null)
    setNom(''); setMatiere(''); setMontant('')
  }

  async function marquerPaye(id: string) {
    const res = await salaireRepo.marquerPaye(id)
    if (res?.error) setErreur('Échec de la mise à jour du statut.')
  }

  function commencerEdition(s: Salaire) {
    setEditionId(s.id)
    setEditionForm({
      enseignant_nom: s.enseignant_nom,
      matiere_principale: s.matiere_principale ?? '',
      salaire_net: String(s.salaire_net),
    })
  }

  async function enregistrerEdition(id: string) {
    const nouveauMontant = parseInt(editionForm.salaire_net, 10)
    setEditionId(null)
    const res = await salaireRepo.update(id, {
      enseignant_nom: editionForm.enseignant_nom,
      matiere_principale: editionForm.matiere_principale || undefined,
      salaire_net: nouveauMontant,
    })
    if (res?.error) setErreur('Échec de la modification.')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-muted">Masse salariale ({moisActuel})</p><p className="text-lg font-semibold text-text">{formatFCFA(resume?.masse ?? 0)}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">Payés</p><p className="text-lg font-semibold text-success">{resume?.payes ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">En attente</p><p className="text-lg font-semibold text-danger">{resume?.en_attente ?? 0}</p></div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAfficherForm(true)}><Plus size={16} /> Ajouter un enseignant</button>
      </div>

      {afficherForm && (
        <div className="card grid grid-cols-3 gap-3 p-4">
          <input className="input-field" placeholder="Nom de l'enseignant" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input className="input-field" placeholder="Matière principale" value={matiere} onChange={(e) => setMatiere(e.target.value)} />
          <input className="input-field" placeholder="Salaire net (FCFA)" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
          <div className="col-span-3 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setAfficherForm(false)}>Annuler</button>
            <button className="btn-primary" onClick={ajouter}>Enregistrer</button>
          </div>
        </div>
      )}

      {erreur && <p className="text-sm text-danger">{erreur}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Enseignant</th>
              <th className="px-4 py-2 font-medium">Matière</th>
              <th className="px-4 py-2 font-medium">Mois</th>
              <th className="px-4 py-2 font-medium">Montant</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {salaires.map((s) => (
              <tr key={s.id}>
                {editionId === s.id ? (
                  <>
                    <td className="px-4 py-1.5">
                      <input className="input-field" value={editionForm.enseignant_nom} onChange={(e) => setEditionForm((p) => ({ ...p, enseignant_nom: e.target.value }))} />
                    </td>
                    <td className="px-4 py-1.5">
                      <input className="input-field" value={editionForm.matiere_principale} onChange={(e) => setEditionForm((p) => ({ ...p, matiere_principale: e.target.value }))} />
                    </td>
                    <td className="px-4 py-2 text-muted">{s.mois}</td>
                    <td className="px-4 py-1.5">
                      <input type="number" className="input-field" value={editionForm.salaire_net} onChange={(e) => setEditionForm((p) => ({ ...p, salaire_net: e.target.value }))} />
                    </td>
                    <td className="px-4 py-2">
                      <span className={`badge ${s.statut === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.statut === 'paye' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-input p-1.5 text-primary hover:bg-blue-50" onClick={() => enregistrerEdition(s.id)} title="Enregistrer">
                          <Save size={14} />
                        </button>
                        <button className="rounded-input p-1.5 text-muted hover:bg-slate-50" onClick={() => setEditionId(null)} title="Annuler">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-medium text-text">{s.enseignant_nom}</td>
                    <td className="px-4 py-2 text-muted">{s.matiere_principale || '—'}</td>
                    <td className="px-4 py-2 text-muted">{s.mois}</td>
                    <td className="px-4 py-2 text-text">{formatFCFA(s.salaire_net)}</td>
                    <td className="px-4 py-2">
                      <span className={`badge ${s.statut === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.statut === 'paye' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-input p-1.5 text-primary hover:bg-blue-50" onClick={() => commencerEdition(s)} title="Modifier">
                          <Pencil size={14} />
                        </button>
                        {s.statut === 'en_attente' && (
                          <button className="btn-secondary" onClick={() => marquerPaye(s.id)}>
                            <CheckCircle2 size={14} /> Marquer payé
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
