'use client'

import { useState } from 'react'
import { Plus, Megaphone } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { mutate, genererId } from '@/lib/sync/syncManager'

interface Annonce {
  id: string
  titre: string
  contenu: string
  priorite: 'normale' | 'importante' | 'urgente'
  date_debut: string
  date_fin?: string
}

const COULEURS: Record<string, string> = {
  normale: 'bg-slate-100 text-slate-600',
  importante: 'bg-amber-100 text-amber-700',
  urgente: 'bg-red-100 text-red-700',
}

export function AnnoncesView({ annonces: annoncesInitiales }: { annonces: Annonce[] }) {
  const { data: session } = useSession()
  const [annonces, setAnnonces] = useState(annoncesInitiales)
  const [enAttenteIds, setEnAttenteIds] = useState<Set<string>>(new Set())
  const [afficherForm, setAfficherForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [priorite, setPriorite] = useState<'normale' | 'importante' | 'urgente'>('normale')
  const [dateFin, setDateFin] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  async function enregistrer() {
    if (!titre || !contenu) return
    const id = genererId()
    const nouvelle: Annonce = {
      id,
      titre,
      contenu,
      priorite,
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: dateFin || undefined,
    }

    // Optimiste : visible immédiatement, connexion ou non.
    setAnnonces((prev) => [nouvelle, ...prev])
    setAfficherForm(false)
    setTitre(''); setContenu(''); setDateFin('')

    const res = await mutate({
      endpoint: '/api/annonces',
      method: 'POST',
      operation: 'INSERT',
      payload: {
        titre: nouvelle.titre,
        contenu: nouvelle.contenu,
        auteur_nom: session?.user?.name ?? 'Admin',
        priorite: nouvelle.priorite,
        date_debut: nouvelle.date_debut,
        date_fin: nouvelle.date_fin,
      },
    })

    if (res?.error) {
      setErreur("Échec de la publication de l'annonce.")
      setAnnonces((prev) => prev.filter((a) => a.id !== id))
      return
    }
    setErreur(null)
    if (res?.queued) {
      setEnAttenteIds((prev) => new Set(prev).add(id))
    } else if (res?.id) {
      setAnnonces((prev) => prev.map((a) => (a.id === id ? { ...a, id: res.id } : a)))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAfficherForm(true)}>
          <Plus size={16} /> Nouvelle annonce
        </button>
      </div>

      {afficherForm && (
        <div className="card space-y-3 p-4">
          <input className="input-field" placeholder="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          <textarea className="input-field" rows={3} placeholder="Contenu" value={contenu} onChange={(e) => setContenu(e.target.value)} />
          <div className="flex items-center gap-3">
            <select className="input-field w-auto" value={priorite} onChange={(e) => setPriorite(e.target.value as any)}>
              <option value="normale">Normale</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
            <input type="date" className="input-field w-auto" value={dateFin} onChange={(e) => setDateFin(e.target.value)} placeholder="Date de fin" />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setAfficherForm(false)}>Annuler</button>
            <button className="btn-primary" onClick={enregistrer}>Publier</button>
          </div>
        </div>
      )}

      {erreur && <p className="text-sm text-danger">{erreur}</p>}

      <div className="space-y-2">
        {annonces.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium text-text">
                <Megaphone size={16} /> {a.titre}
                {enAttenteIds.has(a.id) && (
                  <span className="badge bg-amber-100 text-amber-700">en attente</span>
                )}
              </h3>
              <span className={`badge ${COULEURS[a.priorite]}`}>{a.priorite}</span>
            </div>
            <p className="text-sm text-muted">{a.contenu}</p>
            <p className="mt-2 text-xs text-muted">Publiée le {a.date_debut}</p>
          </div>
        ))}
        {annonces.length === 0 && <p className="text-sm text-muted">Aucune annonce.</p>}
      </div>
    </div>
  )
}
