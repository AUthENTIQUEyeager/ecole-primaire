'use client'

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, Loader2, Printer } from 'lucide-react'
import { absenceRepo } from '@/lib/localdb/repo'
import { localDB } from '@/lib/sync/indexedDB'

interface EleveLeger {
  id: string
  nom: string
  prenom: string
  matricule: string
}

interface AttendanceGridProps {
  classeId: string
  eleves: EleveLeger[]
}

type Etat = 'present' | 'absence' | 'retard'

export function AttendanceGrid({ classeId, eleves }: AttendanceGridProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [enregistrement, setEnregistrement] = useState<string | null>(null)

  // Les absences/retards déjà enregistrés pour CE jour, pour cette classe —
  // permet de rouvrir l'appel du jour sans perdre ce qui a déjà été coché
  // (y compris juste après un redémarrage de l'app, hors ligne).
  const etatsExistants = useLiveQuery(async () => {
    if (!localDB) return {}
    const ids = new Set(eleves.map((e) => e.id))
    const absences = await localDB.absences.where('date_absence').equals(date).toArray()
    const etats: Record<string, Etat> = {}
    for (const a of absences) {
      if (ids.has(a.eleve_id)) etats[a.eleve_id] = a.type
    }
    return etats
  }, [date, eleves])

  const [etatsLocaux, setEtatsLocaux] = useState<Record<string, Etat>>({})
  const etats = { ...(etatsExistants ?? {}), ...etatsLocaux }

  const nbAbsents = useMemo(() => Object.values(etats).filter((e) => e === 'absence').length, [etats])
  const nbRetards = useMemo(() => Object.values(etats).filter((e) => e === 'retard').length, [etats])

  async function marquer(eleveId: string, etat: Etat) {
    const precedent = etats[eleveId]
    const nouveau = precedent === etat ? 'present' : etat
    setEtatsLocaux((prev) => ({ ...prev, [eleveId]: nouveau }))

    if (nouveau === 'present') return // rien à enregistrer pour un élève présent

    setEnregistrement(eleveId)
    await absenceRepo.create({ eleve_id: eleveId, date_absence: date, type: nouveau, justifiee: false })
    setEnregistrement(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setEtatsLocaux({}) }}
            className="input-field w-auto"
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="badge bg-red-100 text-red-700">{nbAbsents} absent(s)</span>
          <span className="badge bg-amber-100 text-amber-700">{nbRetards} retard(s)</span>
          <button className="btn-secondary">
            <Printer size={16} /> Billet d'absence
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Élève</th>
              <th className="px-4 py-2 font-medium">Matricule</th>
              <th className="px-4 py-2 text-center font-medium">Présent</th>
              <th className="px-4 py-2 text-center font-medium">Absent</th>
              <th className="px-4 py-2 text-center font-medium">Retard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eleves.map((e) => {
              const etat = etats[e.id] ?? 'present'
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-text">
                    {e.prenom} {e.nom}
                  </td>
                  <td className="px-4 py-2 text-muted">{e.matricule}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => setEtatsLocaux((prev) => ({ ...prev, [e.id]: 'present' }))}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                        etat === 'present' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border text-muted'
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => marquer(e.id, 'absence')}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                        etat === 'absence' ? 'border-red-500 bg-red-500 text-white' : 'border-border text-muted'
                      }`}
                    >
                      {enregistrement === e.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => marquer(e.id, 'retard')}
                      className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-xs ${
                        etat === 'retard' ? 'border-amber-500 bg-amber-500 text-white' : 'border-border text-muted'
                      }`}
                    >
                      {enregistrement === e.id ? <Loader2 size={14} className="animate-spin" /> : 'R'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
