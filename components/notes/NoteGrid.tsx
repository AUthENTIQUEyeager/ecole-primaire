'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { mutate } from '@/lib/sync/syncManager'

interface Eleve { id: string; nom: string; prenom: string }
interface Matiere { id: string; nom: string; coefficient: number }

export function NoteGrid({
  eleves,
  matieres,
  periode,
}: {
  eleves: Eleve[]
  matieres: Matiere[]
  periode: 'T1' | 'T2' | 'T3'
}) {
  const [valeurs, setValeurs] = useState<Record<string, string>>({})
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function cle(eleveId: string, matiereId: string) {
    return `${eleveId}:${matiereId}`
  }

  async function enregistrerTout() {
    setEnregistrement(true)
    setMessage(null)
    const notes = Object.entries(valeurs)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([key, v]) => {
        const [eleve_id, matiere_id] = key.split(':')
        return {
          eleve_id,
          matiere_id,
          valeur: parseFloat(v),
          note_sur: 20,
          type: 'devoir' as const,
          periode,
          date_evaluation: new Date().toISOString().slice(0, 10),
        }
      })

    if (notes.length === 0) {
      setEnregistrement(false)
      setMessage('Aucune note à enregistrer.')
      return
    }

    const res = await mutate({ endpoint: '/api/notes', method: 'POST', operation: 'INSERT', payload: notes })
    setEnregistrement(false)

    if (res?.error) {
      setMessage("Échec de l'enregistrement — vérifiez les valeurs et réessayez.")
      return
    }
    setMessage(
      res?.queued
        ? `${notes.length} note(s) enregistrée(s) localement — en attente de synchronisation.`
        : `${notes.length} note(s) enregistrée(s).`
    )
    setValeurs({})
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-2 font-medium">Élève</th>
              {matieres.map((m) => (
                <th key={m.id} className="px-3 py-2 text-center font-medium">
                  {m.nom} <span className="text-xs">(coef {m.coefficient})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eleves.map((e) => (
              <tr key={e.id}>
                <td className="sticky left-0 bg-white px-4 py-2 font-medium text-text">{e.prenom} {e.nom}</td>
                {matieres.map((m) => (
                  <td key={m.id} className="px-2 py-1 text-center">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      className="w-16 rounded-input border border-border px-2 py-1 text-center text-sm"
                      value={valeurs[cle(e.id, m.id)] ?? ''}
                      onChange={(ev) =>
                        setValeurs((prev) => ({ ...prev, [cle(e.id, m.id)]: ev.target.value }))
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={enregistrerTout} disabled={enregistrement} className="btn-primary">
          {enregistrement ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Tout enregistrer
        </button>
        {message && <span className="text-sm text-muted">{message}</span>}
      </div>
    </div>
  )
}
