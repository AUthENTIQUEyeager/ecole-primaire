'use client'

import { useState } from 'react'
import { Loader2, X, User } from 'lucide-react'
import { eleveRepo } from '@/lib/localdb/repo'
import { redimensionnerImage } from '@/lib/utils/image'

interface Classe {
  id: string
  nom: string
}

interface EleveExistant {
  id: string
  nom: string
  prenom: string
  sexe: string
  date_naissance: string
  lieu_naissance?: string
  classe_id: string
  whatsapp_parent: string
  nom_parent: string
  telephone_parent?: string
  statut_medical?: string
  photo_url?: string
}

interface EleveFormProps {
  classes: Classe[]
  eleve?: EleveExistant
  onClose: () => void
  onSuccess: (resultat: Record<string, any>) => void
}

const MAX_PHOTO_BYTES = 3 * 1024 * 1024 // limite sur le fichier SOURCE ; il est ensuite compressé

export function EleveForm({ classes, eleve, onClose, onSuccess }: EleveFormProps) {
  const modeEdition = !!eleve
  const [form, setForm] = useState({
    nom: eleve?.nom ?? '',
    prenom: eleve?.prenom ?? '',
    sexe: eleve?.sexe ?? 'M',
    date_naissance: eleve?.date_naissance ?? '',
    lieu_naissance: eleve?.lieu_naissance ?? '',
    classe_id: eleve?.classe_id ?? classes[0]?.id ?? '',
    whatsapp_parent: eleve?.whatsapp_parent ?? '',
    nom_parent: eleve?.nom_parent ?? '',
    telephone_parent: eleve?.telephone_parent ?? '',
    statut_medical: eleve?.statut_medical ?? '',
  })
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(eleve?.photo_url)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_PHOTO_BYTES) {
      setErreur('Photo trop lourde (max 3 Mo).')
      return
    }
    setErreur(null)
    redimensionnerImage(file, 300, 0.85)
      .then(setPhotoUrl)
      .catch(() => setErreur("Impossible de traiter cette image, réessayez avec un autre fichier."))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)

    if (!form.nom || !form.prenom || !form.date_naissance || !form.whatsapp_parent || !form.nom_parent) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setChargement(true)
    const payload = {
      ...form,
      statut_medical: form.statut_medical || undefined,
      lieu_naissance: form.lieu_naissance || undefined,
      telephone_parent: form.telephone_parent || undefined,
      photo_url: photoUrl || undefined,
    }

    const res = modeEdition
      ? await eleveRepo.update(eleve!.id, payload)
      : await eleveRepo.create(payload as any)
    setChargement(false)

    if (res?.error) {
      setErreur('Erreur lors de l’enregistrement. Vérifiez les champs.')
      return
    }

    // L'écriture Dexie a déjà été faite par eleveRepo — la liste et la fiche
    // se mettent à jour toutes seules via leur requête Dexie réactive.
    onSuccess(res)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-[560px] rounded-modal bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">
            {modeEdition ? 'Modifier l’élève' : 'Ajouter un élève'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-primary">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Photo" className="h-full w-full object-cover" />
              ) : (
                <User size={28} />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Photo (facultatif)</label>
              <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="mt-1 block text-xs text-danger hover:underline"
                >
                  Retirer la photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Nom *</label>
              <input className="input-field" value={form.nom} onChange={(e) => update('nom', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Prénom *</label>
              <input className="input-field" value={form.prenom} onChange={(e) => update('prenom', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Sexe *</label>
              <select className="input-field" value={form.sexe} onChange={(e) => update('sexe', e.target.value)}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Classe *</label>
              <select className="input-field" value={form.classe_id} onChange={(e) => update('classe_id', e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Date de naissance *</label>
              <input type="date" className="input-field" value={form.date_naissance} onChange={(e) => update('date_naissance', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Lieu de naissance</label>
              <input className="input-field" value={form.lieu_naissance} onChange={(e) => update('lieu_naissance', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Nom du parent *</label>
              <input className="input-field" value={form.nom_parent} onChange={(e) => update('nom_parent', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">WhatsApp parent *</label>
              <input className="input-field" value={form.whatsapp_parent} onChange={(e) => update('whatsapp_parent', e.target.value)} placeholder="+226 70 00 00 00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Téléphone parent</label>
              <input className="input-field" value={form.telephone_parent} onChange={(e) => update('telephone_parent', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Statut médical</label>
              <select className="input-field" value={form.statut_medical} onChange={(e) => update('statut_medical', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="apte">Apte</option>
                <option value="inapte">Inapte</option>
              </select>
            </div>
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={chargement} className="btn-primary">
              {chargement ? <Loader2 size={16} className="animate-spin" /> : null}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
