'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { mutate, genererId } from '@/lib/sync/syncManager'

interface Matiere {
  id: string
  nom: string
  code: string
  coefficient: number
}

export function MatieresConfig({ matieres }: { matieres: Matiere[] }) {
  const [lignes, setLignes] = useState(matieres)
  const [enAttenteIds, setEnAttenteIds] = useState<Set<string>>(new Set())
  const [enregistrementId, setEnregistrementId] = useState<string | null>(null)
  const [afficherForm, setAfficherForm] = useState(false)
  const [nom, setNom] = useState('')
  const [code, setCode] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  const [erreur, setErreur] = useState<string | null>(null)

  function updateLigne(id: string, field: 'nom' | 'coefficient', value: string) {
    setLignes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: field === 'coefficient' ? Number(value) : value } : m))
    )
  }

  async function enregistrerLigne(m: Matiere) {
    setEnregistrementId(m.id)
    const res = await mutate({
      endpoint: `/api/matieres/${m.id}`,
      method: 'PUT',
      operation: 'UPDATE',
      payload: { nom: m.nom, coefficient: m.coefficient },
    })
    setEnregistrementId(null)
    if (res?.error) {
      setErreur("Échec de l'enregistrement de cette matière.")
      return
    }
    setErreur(null)
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette matière ?')) return
    // Optimiste : on retire tout de suite de la liste locale.
    const sauvegarde = lignes
    setLignes((prev) => prev.filter((m) => m.id !== id))
    const res = await mutate({ endpoint: `/api/matieres/${id}`, method: 'DELETE', operation: 'DELETE', payload: {} })
    if (res?.error) {
      setErreur('Échec de la suppression — la matière a été remise dans la liste.')
      setLignes(sauvegarde)
    }
  }

  async function ajouter() {
    if (!nom || !code) return
    const id = genererId()
    const nouvelleMatiere: Matiere = { id, nom, code, coefficient: Number(coefficient) || 1 }

    // Optimiste : affichée immédiatement, connexion ou non.
    setLignes((prev) => [...prev, nouvelleMatiere])
    setAfficherForm(false)
    setNom(''); setCode(''); setCoefficient('1')

    const res = await mutate({
      endpoint: '/api/matieres',
      method: 'POST',
      operation: 'INSERT',
      payload: { nom, code, coefficient: nouvelleMatiere.coefficient },
    })

    if (res?.error) {
      setErreur("Échec de l'ajout de cette matière.")
      setLignes((prev) => prev.filter((m) => m.id !== id))
      return
    }
    if (res?.queued) {
      setEnAttenteIds((prev) => new Set(prev).add(id))
      return
    }
    // Succès en ligne : on remplace l'id temporaire par le vrai id serveur.
    if (res?.id) {
      setLignes((prev) => prev.map((m) => (m.id === id ? { ...m, id: res.id } : m)))
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Matières et coefficients</h2>
        <button className="btn-secondary" onClick={() => setAfficherForm(true)}>
          <Plus size={16} /> Ajouter une matière
        </button>
      </div>

      {afficherForm && (
        <div className="grid grid-cols-4 gap-2 rounded-input border border-border p-3">
          <input className="input-field" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input className="input-field" placeholder="Code (ex: LEC)" value={code} onChange={(e) => setCode(e.target.value)} />
          <input className="input-field" type="number" min={1} placeholder="Coefficient" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setAfficherForm(false)}>Annuler</button>
            <button className="btn-primary" onClick={ajouter}>Ajouter</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-input border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Matière</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Coefficient</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lignes.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-1.5">
                  <input
                    className="input-field"
                    value={m.nom}
                    onChange={(e) => updateLigne(m.id, 'nom', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5 text-muted">
                  {m.code}
                  {enAttenteIds.has(m.id) && (
                    <span className="badge ml-2 bg-amber-100 text-amber-700">en attente</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={1}
                    className="input-field w-20"
                    value={m.coefficient}
                    onChange={(e) => updateLigne(m.id, 'coefficient', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex justify-end gap-1">
                    <button
                      className="rounded-input p-1.5 text-primary hover:bg-blue-50"
                      onClick={() => enregistrerLigne(m)}
                      title="Enregistrer"
                    >
                      {enregistrementId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    </button>
                    <button
                      className="rounded-input p-1.5 text-danger hover:bg-red-50"
                      onClick={() => supprimer(m.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">Aucune matière.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Les modifications de coefficient s'appliquent aux futurs calculs de moyenne — les bulletins déjà
        générés ne sont pas recalculés rétroactivement.
      </p>
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
    </div>
  )
}
