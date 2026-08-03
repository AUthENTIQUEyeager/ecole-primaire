'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PartyPopper } from 'lucide-react'
import { evenementRepo } from '@/lib/localdb/repo'
import { formatFCFA } from '@/lib/utils/paiement'

const LABELS_TYPE: Record<string, string> = { sortie: 'Sortie', cloture: 'Clôture', autre: 'Autre' }

interface Evenement {
  id: string
  nom: string
  type: 'sortie' | 'cloture' | 'autre'
  montant_cotisation: number
  date_evenement: string
  statut: 'actif' | 'cloture'
  totalCotise: number
  totalAttendu: number
}

interface Classe {
  id: string
  nom: string
}

export function EvenementsView({ evenements, classes }: { evenements: Evenement[]; classes: Classe[] }) {
  const router = useRouter()
  const [afficherForm, setAfficherForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAfficherForm(true)}>
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evenements.map((ev) => {
          const pct = ev.totalAttendu > 0 ? Math.round((ev.totalCotise / ev.totalAttendu) * 100) : 0
          return (
            <div
              key={ev.id}
              className="card cursor-pointer p-4 hover:border-primary"
              onClick={() => router.push(`/admin/evenements/detail?id=${ev.id}`)}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-card bg-blue-50 text-primary">
                  <PartyPopper size={18} />
                </div>
                <span className={`badge ${ev.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {ev.statut === 'actif' ? 'Actif' : 'Clôturé'}
                </span>
              </div>
              <p className="font-semibold text-text">{ev.nom}</p>
              <p className="mb-2 text-sm text-muted">{LABELS_TYPE[ev.type]} — {ev.date_evenement}</p>
              <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="text-xs text-muted">
                {formatFCFA(ev.totalCotise)} / {formatFCFA(ev.totalAttendu)} collectés ({pct}%)
              </p>
            </div>
          )
        })}
        {evenements.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted">Aucun événement pour l'instant.</p>
        )}
      </div>

      {afficherForm && <EvenementForm classes={classes} onClose={() => setAfficherForm(false)} />}
    </div>
  )
}

function EvenementForm({ classes, onClose }: { classes: Classe[]; onClose: () => void }) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [type, setType] = useState<'sortie' | 'cloture' | 'autre'>('sortie')
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState('')
  const [portee, setPortee] = useState<'toutes' | 'classes'>('toutes')
  const [classesChoisies, setClassesChoisies] = useState<string[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  function toggleClasse(id: string) {
    setClassesChoisies((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function creer() {
    setErreur(null)
    const montantNum = parseInt(montant, 10)
    if (!nom.trim() || !montantNum || !date) {
      setErreur('Veuillez remplir le nom, le montant et la date.')
      return
    }
    if (portee === 'classes' && classesChoisies.length === 0) {
      setErreur('Sélectionnez au moins une classe.')
      return
    }

    setChargement(true)
    const res = await evenementRepo.create({
      nom,
      type,
      description: description || undefined,
      montant_cotisation: montantNum,
      date_evenement: date,
      classes_ids: portee === 'toutes' ? 'toutes' : classesChoisies,
    })
    setChargement(false)

    if (res?.error) {
      setErreur("Échec de la création de l'événement.")
      return
    }
    router.push(`/admin/evenements/detail?id=${res.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[520px] rounded-modal bg-surface p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold text-text">Nouvel événement</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Nom</label>
            <input className="input-field" placeholder="Ex : Sortie au zoo, Fête de fin d'année..." value={nom} onChange={(e) => setNom(e.target.value)} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Type</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="sortie">Sortie</option>
                <option value="cloture">Clôture</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Cotisation par élève (FCFA)</label>
            <input type="number" className="input-field" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Ex : 2000" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Description (optionnel)</label>
            <textarea className="input-field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Élèves concernés</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPortee('toutes')} className={`rounded-input border px-3 py-1.5 text-sm ${portee === 'toutes' ? 'border-primary bg-blue-50 text-primary' : 'border-border text-text'}`}>
                Toute l'école
              </button>
              <button type="button" onClick={() => setPortee('classes')} className={`rounded-input border px-3 py-1.5 text-sm ${portee === 'classes' ? 'border-primary bg-blue-50 text-primary' : 'border-border text-text'}`}>
                Classes spécifiques
              </button>
            </div>
            {portee === 'classes' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleClasse(c.id)}
                    className={`rounded-input border px-3 py-1.5 text-sm ${classesChoisies.includes(c.id) ? 'border-primary bg-blue-50 text-primary' : 'border-border text-text'}`}
                  >
                    {c.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="button" disabled={chargement} className="btn-primary" onClick={creer}>
              Créer l'événement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
