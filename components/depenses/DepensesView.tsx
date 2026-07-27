'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/paiement'
import { depenseRepo } from '@/lib/localdb/repo'

const CATEGORIES = ['salaires', 'fournitures', 'entretien', 'factures', 'loyer', 'imprevus', 'autre'] as const

interface Depense {
  id: string
  categorie: string
  description: string
  montant: number
  date_depense: string
}

// `depenses` / `totalParCategorie` viennent d'une requête Dexie réactive dans
// la page parente : un ajout se reflète automatiquement, plus d'état dupliqué.
export function DepensesView({
  depenses,
  totalParCategorie,
}: {
  depenses: Depense[]
  totalParCategorie: { categorie: string; total: number }[]
}) {
  const { data: session } = useSession()
  const [afficherForm, setAfficherForm] = useState(false)
  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]>('fournitures')
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [erreur, setErreur] = useState<string | null>(null)

  async function ajouter() {
    if (!description || !montant) return
    const montantNum = parseInt(montant, 10)
    if (!montantNum) return

    setAfficherForm(false)
    const res = await depenseRepo.create({
      categorie,
      description,
      montant: montantNum,
      date_depense: date,
      created_by_nom: session?.user?.name ?? 'Admin',
    })

    if (res?.error) {
      setErreur("Échec de l'enregistrement de la dépense.")
      return
    }
    setErreur(null)
    setDescription('')
    setMontant('')
  }

  const totalMois = totalParCategorie.reduce((a, c) => a + c.total, 0)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="mb-2 text-sm font-semibold text-text">Total ce mois : {formatFCFA(totalMois)}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
          {CATEGORIES.map((c) => {
            const total = totalParCategorie.find((t) => t.categorie === c)?.total ?? 0
            return (
              <div key={c} className="rounded-input border border-border p-2 text-center">
                <p className="text-xs capitalize text-muted">{c}</p>
                <p className="text-sm font-semibold text-text">{formatFCFA(total)}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAfficherForm(true)}><Plus size={16} /> Ajouter une dépense</button>
      </div>

      {afficherForm && (
        <div className="card grid grid-cols-4 gap-3 p-4">
          <select className="input-field" value={categorie} onChange={(e) => setCategorie(e.target.value as any)}>
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <input className="input-field col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="input-field" placeholder="Montant (FCFA)" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
          <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="col-span-4 flex justify-end gap-2">
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
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Catégorie</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {depenses.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2 text-muted">{d.date_depense}</td>
                <td className="px-4 py-2 capitalize text-text">{d.categorie}</td>
                <td className="px-4 py-2 text-muted">{d.description}</td>
                <td className="px-4 py-2 font-medium text-text">{formatFCFA(d.montant)}</td>
              </tr>
            ))}
            {depenses.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Aucune dépense enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
