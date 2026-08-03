'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRouter } from 'next/navigation'
import { Wallet, Trash2, Lock, Unlock, Plus } from 'lucide-react'
import { localDB } from '@/lib/sync/indexedDB'
import { evenementRepo, evenementDepenseRepo } from '@/lib/localdb/repo'
import { LABELS_STATUT, COULEURS_STATUT, formatFCFA, type StatutPaiement } from '@/lib/utils/paiement'
import { CotisationVersementModal } from './CotisationVersementModal'
import { PDFActions } from '@/components/documents/PDFActions'
import { RecuEvenementDocument } from '@/components/documents/RecuEvenementPDF'

const LABELS_TYPE: Record<string, string> = { sortie: 'Sortie', cloture: 'Clôture', autre: 'Autre' }
const CATEGORIES = ['transport', 'repas', 'materiel', 'animation', 'autre'] as const

interface EvenementDetailProps {
  evenementId: string
}

export function EvenementDetail({ evenementId }: EvenementDetailProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'cotisations' | 'depenses' | 'recus'>('cotisations')
  const [modalCotisation, setModalCotisation] = useState<{ id: string; eleveId: string; nom: string; du: number; paye: number } | null>(null)

  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [evenement, cotisationsRaw, versements, depenses, classes, configRows] = await Promise.all([
      localDB.evenements.get(evenementId),
      localDB.evenementCotisations.where('evenement_id').equals(evenementId).toArray(),
      localDB.evenementVersements.where('evenement_id').equals(evenementId).toArray(),
      localDB.evenementDepenses.where('evenement_id').equals(evenementId).toArray(),
      localDB.classes.toArray(),
      localDB.config.toArray(),
    ])
    if (!evenement) return null

    const eleveIds = cotisationsRaw.map((c) => c.eleve_id)
    const eleves = await localDB.eleves.bulkGet(eleveIds)
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const elevesById = new Map(eleves.filter(Boolean).map((e) => [e!.id, e!]))

    const cotisations = cotisationsRaw
      .map((c) => {
        const eleve = elevesById.get(c.eleve_id)
        return {
          ...c,
          eleve_nom: eleve?.nom ?? '',
          eleve_prenom: eleve?.prenom ?? '',
          classe_nom: eleve ? classesById.get(eleve.classe_id)?.nom ?? '' : '',
          matricule: eleve?.matricule ?? '',
        }
      })
      .sort((a, b) => (a.eleve_nom + a.eleve_prenom).localeCompare(b.eleve_nom + b.eleve_prenom))

    const totalCotise = cotisations.reduce((a, c) => a + c.montant_paye, 0)
    const totalAttendu = cotisations.reduce((a, c) => a + c.montant_du, 0)
    const totalDepenses = depenses.reduce((a, d) => a + d.montant, 0)

    const versementsEnrichis = versements
      .map((v) => {
        const eleve = elevesById.get(v.eleve_id)
        const cotisation = cotisationsRaw.find((c) => c.id === v.cotisation_id)
        return {
          ...v,
          eleve_nom: eleve?.nom ?? '',
          eleve_prenom: eleve?.prenom ?? '',
          matricule: eleve?.matricule ?? '',
          classe_nom: eleve ? classesById.get(eleve.classe_id)?.nom ?? '' : '',
          montant_du: cotisation?.montant_du ?? 0,
          montant_paye_cumul: cotisation?.montant_paye ?? 0,
        }
      })
      .sort((a, b) => (a.date_versement < b.date_versement ? 1 : -1))

    const config = Object.fromEntries(configRows.map((r) => [r.key, r.value]))

    return { evenement, cotisations, versements: versementsEnrichis, depenses, totalCotise, totalAttendu, totalDepenses, config }
  }, [evenementId])

  if (data === null) {
    return <p className="text-sm text-muted">Événement introuvable.</p>
  }
  if (data === undefined) {
    return <p className="text-sm text-muted">Chargement...</p>
  }

  const { evenement, cotisations, versements, depenses, totalCotise, totalAttendu, totalDepenses, config } = data
  const solde = totalCotise - totalDepenses

  async function basculerStatut() {
    if (evenement.statut === 'actif') await evenementRepo.cloturer(evenementId)
    else await evenementRepo.reactiver(evenementId)
  }

  async function supprimer() {
    if (!confirm(`Supprimer définitivement "${evenement.nom}" et toutes ses cotisations/dépenses ?`)) return
    await evenementRepo.remove(evenementId)
    router.push('/admin/evenements')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text">{evenement.nom}</h1>
            <span className="badge bg-slate-100 text-slate-600">{LABELS_TYPE[evenement.type]}</span>
            <span className={`badge ${evenement.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {evenement.statut === 'actif' ? 'Actif' : 'Clôturé'}
            </span>
          </div>
          <p className="text-sm text-muted">
            {evenement.date_evenement} — cotisation {formatFCFA(evenement.montant_cotisation)} / élève
            {evenement.description ? ` — ${evenement.description}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={basculerStatut}>
            {evenement.statut === 'actif' ? <Lock size={14} /> : <Unlock size={14} />}
            {evenement.statut === 'actif' ? 'Clôturer' : 'Réactiver'}
          </button>
          <button className="btn-secondary text-danger" onClick={supprimer}>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Cotisé</p>
          <p className="text-lg font-semibold text-text">{formatFCFA(totalCotise)} <span className="text-sm font-normal text-muted">/ {formatFCFA(totalAttendu)}</span></p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Dépenses</p>
          <p className="text-lg font-semibold text-danger">{formatFCFA(totalDepenses)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Solde</p>
          <p className={`text-lg font-semibold ${solde >= 0 ? 'text-success' : 'text-danger'}`}>{formatFCFA(solde)}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['cotisations', 'depenses', 'recus'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-text'
            }`}
          >
            {t === 'cotisations' ? 'Cotisations' : t === 'depenses' ? 'Dépenses' : 'Reçus'}
          </button>
        ))}
      </div>

      {tab === 'cotisations' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Élève</th>
                <th className="px-4 py-2 font-medium">Classe</th>
                <th className="px-4 py-2 font-medium">Payé / Dû</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cotisations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-text">{c.eleve_prenom} {c.eleve_nom}</td>
                  <td className="px-4 py-2 text-muted">{c.classe_nom}</td>
                  <td className="px-4 py-2 text-text">{formatFCFA(c.montant_paye)} / {formatFCFA(c.montant_du)}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${COULEURS_STATUT[c.statut as StatutPaiement] ?? ''}`}>
                      {LABELS_STATUT[c.statut as StatutPaiement] ?? c.statut}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setModalCotisation({ id: c.id, eleveId: c.eleve_id, nom: `${c.eleve_prenom} ${c.eleve_nom}`, du: c.montant_du, paye: c.montant_paye })
                      }
                    >
                      <Wallet size={14} /> Versement
                    </button>
                  </td>
                </tr>
              ))}
              {cotisations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucun élève concerné.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'depenses' && <EvenementDepenses evenementId={evenementId} depenses={depenses as any[]} />}

      {tab === 'recus' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Reçu</th>
                <th className="px-4 py-2 font-medium">Élève</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Montant</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versements.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-text">{v.numero_recu}</td>
                  <td className="px-4 py-2 text-muted">{v.eleve_prenom} {v.eleve_nom}</td>
                  <td className="px-4 py-2 text-muted">{v.date_versement}</td>
                  <td className="px-4 py-2 font-medium text-text">{formatFCFA(v.montant)}</td>
                  <td className="px-4 py-2 text-right">
                    <PDFActions
                      fileName={`recu-${v.numero_recu}.pdf`}
                      downloadLabel="Reçu"
                      depsKey={v.numero_recu}
                      document={
                        <RecuEvenementDocument
                          data={{
                            nomEcole: config.nom_ecole ?? '',
                            adresseEcole: config.adresse ?? '',
                            logoUrl: config.logo_url || undefined,
                            numeroRecu: v.numero_recu,
                            nomEvenement: evenement.nom,
                            eleveNom: v.eleve_nom,
                            elevePrenom: v.eleve_prenom,
                            matricule: v.matricule,
                            classe: v.classe_nom,
                            montant: v.montant,
                            cumulPaye: v.montant_paye_cumul,
                            montantDu: v.montant_du,
                            resteAPayer: v.montant_du - v.montant_paye_cumul,
                            dateVersement: v.date_versement,
                            modePaiement: v.mode_paiement,
                            caissier: v.caissier_nom,
                          }}
                        />
                      }
                    />
                  </td>
                </tr>
              ))}
              {versements.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucun versement enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalCotisation && (
        <CotisationVersementModal
          cotisationId={modalCotisation.id}
          eleveId={modalCotisation.eleveId}
          evenementId={evenementId}
          eleveNom={modalCotisation.nom}
          montantDu={modalCotisation.du}
          montantPaye={modalCotisation.paye}
          onClose={() => setModalCotisation(null)}
          onSuccess={() => setModalCotisation(null)}
        />
      )}
    </div>
  )
}

function EvenementDepenses({ evenementId, depenses }: { evenementId: string; depenses: any[] }) {
  const [afficherForm, setAfficherForm] = useState(false)
  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]>('transport')
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [erreur, setErreur] = useState<string | null>(null)

  async function ajouter() {
    if (!description || !montant) return
    const montantNum = parseInt(montant, 10)
    if (!montantNum) return
    setAfficherForm(false)
    const res = await evenementDepenseRepo.create({
      evenement_id: evenementId,
      categorie,
      description,
      montant: montantNum,
      date_depense: date,
      created_by_nom: 'Admin',
    })
    if (res?.error) {
      setErreur("Échec de l'enregistrement de la dépense.")
      return
    }
    setErreur(null)
    setDescription('')
    setMontant('')
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await evenementDepenseRepo.remove(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAfficherForm(true)}>
          <Plus size={16} /> Ajouter une dépense
        </button>
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
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {depenses.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2 text-muted">{d.date_depense}</td>
                <td className="px-4 py-2 capitalize text-text">{d.categorie}</td>
                <td className="px-4 py-2 text-muted">{d.description}</td>
                <td className="px-4 py-2 font-medium text-text">{formatFCFA(d.montant)}</td>
                <td className="px-4 py-2 text-right">
                  <button className="rounded-input p-1.5 text-danger hover:bg-red-50" onClick={() => supprimer(d.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {depenses.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucune dépense enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
