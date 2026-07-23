'use client'

import { useState, useMemo } from 'react'
import { Search, BarChart3 } from 'lucide-react'

interface AbsenceRow {
  id: string
  date_absence: string
  type: 'absence' | 'retard'
  justifiee: number
  motif?: string
  nom: string
  prenom: string
  classe_nom: string
}

interface Classe { id: string; nom: string }
interface StatRow { nom: string; total: number }

export function AbsencesView({
  absences,
  classes,
  stats,
}: {
  absences: AbsenceRow[]
  classes: Classe[]
  stats: StatRow[]
}) {
  const [recherche, setRecherche] = useState('')
  const [classeFiltre, setClasseFiltre] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [justifieeFiltre, setJustifieeFiltre] = useState('')
  const [afficherStats, setAfficherStats] = useState(false)

  const filtres = useMemo(() => {
    return absences.filter((a) => {
      const matchRecherche =
        !recherche || `${a.prenom} ${a.nom}`.toLowerCase().includes(recherche.toLowerCase())
      const matchClasse = !classeFiltre || a.classe_nom === classeFiltre
      const matchType = !typeFiltre || a.type === typeFiltre
      const matchJustifiee =
        !justifieeFiltre || (justifieeFiltre === 'oui' ? a.justifiee : !a.justifiee)
      return matchRecherche && matchClasse && matchType && matchJustifiee
    })
  }, [absences, recherche, classeFiltre, typeFiltre, justifieeFiltre])

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
          <select className="input-field w-auto" value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)}>
            <option value="">Tous types</option>
            <option value="absence">Absence</option>
            <option value="retard">Retard</option>
          </select>
          <select className="input-field w-auto" value={justifieeFiltre} onChange={(e) => setJustifieeFiltre(e.target.value)}>
            <option value="">Justifiée ou non</option>
            <option value="oui">Justifiée</option>
            <option value="non">Non justifiée</option>
          </select>
        </div>
        <button className="btn-secondary" onClick={() => setAfficherStats((v) => !v)}>
          <BarChart3 size={16} /> Statistiques par classe
        </button>
      </div>

      {afficherStats && (
        <div className="card grid grid-cols-3 gap-3 p-4 sm:grid-cols-6">
          {stats.map((s) => (
            <div key={s.nom} className="rounded-input border border-border p-2 text-center">
              <p className="text-xs text-muted">{s.nom}</p>
              <p className="font-semibold text-text">{s.total}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Élève</th>
              <th className="px-4 py-2 font-medium">Classe</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Justifiée</th>
              <th className="px-4 py-2 font-medium">Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtres.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-text">{a.prenom} {a.nom}</td>
                <td className="px-4 py-2 text-muted">{a.classe_nom}</td>
                <td className="px-4 py-2 text-muted">{a.date_absence}</td>
                <td className="px-4 py-2 text-muted capitalize">{a.type}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${a.justifiee ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {a.justifiee ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted">{a.motif || '—'}</td>
              </tr>
            ))}
            {filtres.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Aucune absence ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
