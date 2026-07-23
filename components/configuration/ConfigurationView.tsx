'use client'

import { useState } from 'react'
import { Save, Loader2, School } from 'lucide-react'
import { mutate } from '@/lib/sync/syncManager'
import { redimensionnerImage } from '@/lib/utils/image'

const MAX_LOGO_BYTES = 3 * 1024 * 1024 // limite sur le fichier SOURCE ; il est ensuite compressé

export function ConfigurationView({ config }: { config: Record<string, string> }) {
  const [form, setForm] = useState({
    nom_ecole: config.nom_ecole ?? '',
    directeur_nom: config.directeur_nom ?? '',
    adresse: config.adresse ?? '',
    telephone: config.telephone ?? '',
    annee_scolaire: config.annee_scolaire ?? '',
    frais_annuels: config.frais_annuels ?? '',
    tranche1_montant: config.tranche1_montant ?? '',
    tranche1_echeance: config.tranche1_echeance ?? '',
    tranche2_montant: config.tranche2_montant ?? '',
    tranche2_echeance: config.tranche2_echeance ?? '',
    tranche3_montant: config.tranche3_montant ?? '',
    tranche3_echeance: config.tranche3_echeance ?? '',
  })
  const [logoUrl, setLogoUrl] = useState<string | undefined>(config.logo_url)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageErreur, setMessageErreur] = useState(false)
  const [erreurLogo, setErreurLogo] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      setErreurLogo('Image trop lourde (max 3 Mo).')
      return
    }
    setErreurLogo(null)
    redimensionnerImage(file, 400, 0.85)
      .then(setLogoUrl)
      .catch(() => setErreurLogo("Impossible de traiter cette image, réessayez avec un autre fichier."))
  }

  async function enregistrer() {
    setEnregistrement(true)
    setMessage(null)
    const res = await mutate({
      endpoint: '/api/config',
      method: 'PUT',
      operation: 'UPDATE',
      payload: {
        ...form,
        frais_annuels: Number(form.frais_annuels),
        tranche1_montant: Number(form.tranche1_montant),
        tranche2_montant: Number(form.tranche2_montant),
        tranche3_montant: Number(form.tranche3_montant),
        logo_url: logoUrl,
      },
    })
    setEnregistrement(false)

    if (res?.error) {
      setMessageErreur(true)
      setMessage(
        `Erreur lors de l'enregistrement (code ${res.status ?? '?'}). ` +
        'Vérifiez que tous les champs numériques sont bien remplis, ou réessayez.'
      )
      return
    }
    if (res?.queued) {
      setMessageErreur(true)
      setMessage('Hors ligne — la configuration sera enregistrée dès la reconnexion.')
      return
    }
    setMessageErreur(false)
    setMessage('Configuration enregistrée.')
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-text">Informations de l'école</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-blue-50 text-primary">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <School size={28} />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">
              Logo de l'école (utilisé sur les reçus, bulletins et autres documents imprimés)
            </label>
            <input type="file" accept="image/*" onChange={handleLogo} className="text-sm" />
            {erreurLogo && <p className="mt-1 text-xs text-danger">{erreurLogo}</p>}
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl(undefined)} className="mt-1 block text-xs text-danger hover:underline">
                Retirer le logo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-muted">Nom de l'école</label>
            <input className="input-field" value={form.nom_ecole} onChange={(e) => update('nom_ecole', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Directeur</label>
            <input className="input-field" value={form.directeur_nom} onChange={(e) => update('directeur_nom', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Adresse</label>
            <input className="input-field" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Téléphone</label>
            <input className="input-field" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Année scolaire active</label>
            <input className="input-field" value={form.annee_scolaire} onChange={(e) => update('annee_scolaire', e.target.value)} placeholder="2024-2025" />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-text">Frais scolaires</h2>
        <div>
          <label className="mb-1 block text-sm text-muted">Frais annuels totaux (FCFA)</label>
          <input className="input-field w-48" type="number" value={form.frais_annuels} onChange={(e) => update('frais_annuels', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-input border border-border p-3">
              <p className="mb-2 text-sm font-medium text-text">Tranche {n}</p>
              <label className="mb-1 block text-xs text-muted">Montant (FCFA)</label>
              <input
                className="input-field mb-2"
                type="number"
                value={(form as any)[`tranche${n}_montant`]}
                onChange={(e) => update(`tranche${n}_montant`, e.target.value)}
              />
              <label className="mb-1 block text-xs text-muted">Échéance</label>
              <input
                className="input-field"
                type="date"
                value={(form as any)[`tranche${n}_echeance`]}
                onChange={(e) => update(`tranche${n}_echeance`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={enregistrer} disabled={enregistrement}>
          {enregistrement ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer la configuration
        </button>
        {message && (
          <span className={`text-sm ${messageErreur ? 'text-danger' : 'text-success'}`}>{message}</span>
        )}
      </div>
    </div>
  )
}
