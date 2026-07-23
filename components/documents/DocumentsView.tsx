'use client'

import { useState, useEffect } from 'react'
import { Receipt, BookOpen, CalendarX, Mail, CreditCard } from 'lucide-react'
import { RecuDocument } from '@/components/paiements/RecuPDF'
import { BulletinDocument } from '@/components/notes/BulletinPDF'
import { BilletDocument } from './BilletPDF'
import { CarteDocument } from './CarteScolairePDF'
import { ConvocationDocument } from './ConvocationPDF'
import { PDFActions } from './PDFActions'
import {
  calculerMoyennesParMatiere,
  calculerMoyenneGenerale,
  calculerRangs,
} from '@/lib/utils/notes'

interface Eleve {
  id: string
  nom: string
  prenom: string
  matricule: string
  annee_scolaire: string
  classe_id: string
  classe_nom: string
  photo_url?: string
}

const SECTIONS = [
  { key: 'recu', label: "Reçu de paiement", icon: Receipt },
  { key: 'bulletin', label: 'Bulletin de notes', icon: BookOpen },
  { key: 'billet', label: "Billet d'absence", icon: CalendarX },
  { key: 'convocation', label: 'Convocation', icon: Mail },
  { key: 'carte', label: 'Carte scolaire', icon: CreditCard },
] as const

export function DocumentsView({ eleves, config }: { eleves: Eleve[]; config: Record<string, string> }) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]['key']>('recu')
  const [eleveId, setEleveId] = useState(eleves[0]?.id ?? '')
  const eleve = eleves.find((e) => e.id === eleveId)
  const logoUrl = config.logo_url || undefined

  const [versements, setVersements] = useState<any[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [periode, setPeriode] = useState<'T1' | 'T2' | 'T3'>('T1')
  const [notesClasse, setNotesClasse] = useState<any[]>([])
  const [appreciation, setAppreciation] = useState('')

  useEffect(() => {
    if (!eleveId) return
    fetch(`/api/eleves/${eleveId}/paiements`).then((r) => r.json()).then((d) => {
      setVersements(d.versements ?? [])
      setPaiements(d.paiements ?? [])
    })
    fetch(`/api/eleves/${eleveId}/absences`).then((r) => r.json()).then(setAbsences)
    fetch(`/api/eleves/${eleveId}/notes`).then((r) => r.json()).then(setNotes)
  }, [eleveId])

  // Notes de toute la classe pour la période — nécessaire pour calculer le vrai rang.
  useEffect(() => {
    if (!eleve || section !== 'bulletin') return
    fetch(`/api/notes?classe_id=${eleve.classe_id}&periode=${periode}`)
      .then((r) => r.json())
      .then(setNotesClasse)
  }, [eleve, periode, section])

  const notesPeriode = notes.filter((n) => n.periode === periode)
  const moyennes = calculerMoyennesParMatiere(
    notesPeriode.map((n) => ({
      matiere_id: n.matiere_id,
      coefficient: n.coefficient,
      valeur: n.valeur,
      note_sur: n.note_sur,
    }))
  )
  const moyenneGenerale = calculerMoyenneGenerale(moyennes)
  const absencesNonJustifiees = absences.filter((a) => !a.justifiee).length

  // Rang réel : regroupe les notes de la classe par élève, calcule la moyenne
  // générale de chacun, puis classe.
  const parEleve = new Map<string, any[]>()
  for (const n of notesClasse) {
    const liste = parEleve.get(n.eleve_id) ?? []
    liste.push(n)
    parEleve.set(n.eleve_id, liste)
  }
  const moyennesClasse = Array.from(parEleve.entries()).map(([eleve_id, ns]) => {
    const m = calculerMoyennesParMatiere(
      ns.map((n) => ({ matiere_id: n.matiere_id, coefficient: n.coefficient, valeur: n.valeur, note_sur: n.note_sur }))
    )
    return { eleve_id, moyenneGenerale: calculerMoyenneGenerale(m) }
  })
  const rangs = calculerRangs(moyennesClasse)
  const rang = eleve ? rangs.get(eleve.id) ?? 1 : 1
  const effectifClasse = Math.max(moyennesClasse.length, 1)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="space-y-1">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-sm ${
              section === key ? 'bg-blue-50 font-medium text-primary' : 'text-text hover:bg-slate-50'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div className="card p-5">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text">Élève</label>
          <select className="input-field" value={eleveId} onChange={(e) => setEleveId(e.target.value)}>
            {eleves.map((e) => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.classe_nom}</option>
            ))}
          </select>
        </div>

        {!eleve ? (
          <p className="text-sm text-muted">Aucun élève sélectionné.</p>
        ) : section === 'recu' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Sélectionnez un reçu à télécharger ou imprimer.</p>
            {versements.length === 0 && <p className="text-sm text-muted">Aucun versement enregistré pour cet élève.</p>}
            <ul className="space-y-2">
              {versements.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-input border border-border p-3 text-sm">
                  <span>{v.numero_recu} — {v.montant.toLocaleString('fr-FR')} FCFA — {v.date_versement}</span>
                  <PDFActions
                    fileName={`recu-${v.numero_recu}.pdf`}
                    document={
                      <RecuDocument
                        data={{
                          nomEcole: config.nom_ecole ?? '',
                          adresseEcole: config.adresse ?? '',
                          logoUrl,
                          numeroRecu: v.numero_recu,
                          eleveNom: eleve.nom,
                          elevePrenom: eleve.prenom,
                          matricule: eleve.matricule,
                          classe: eleve.classe_nom,
                          tranche: paiements.find((p) => p.id === v.paiement_id)?.tranche ?? 1,
                          montant: v.montant,
                          cumulPaye: paiements.reduce((a, p) => a + p.montant_paye, 0),
                          resteAPayer:
                            paiements.reduce((a, p) => a + p.montant_du, 0) -
                            paiements.reduce((a, p) => a + p.montant_paye, 0),
                          dateVersement: v.date_versement,
                          modePaiement: v.mode_paiement,
                          caissier: v.caissier_nom,
                        }}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : section === 'bulletin' ? (
          <div className="space-y-3">
            <select className="input-field w-auto" value={periode} onChange={(e) => setPeriode(e.target.value as any)}>
              <option value="T1">Trimestre 1</option>
              <option value="T2">Trimestre 2</option>
              <option value="T3">Trimestre 3</option>
            </select>
            <p className="text-sm text-muted">
              Moyenne générale {periode} : <span className="font-medium text-text">{moyenneGenerale.toFixed(2)}/20</span>
              {' — '}Rang : <span className="font-medium text-text">{rang}/{effectifClasse}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Appréciation générale (facultatif)</label>
              <textarea
                className="input-field"
                rows={3}
                value={appreciation}
                onChange={(e) => setAppreciation(e.target.value)}
                placeholder="Ex : Trimestre satisfaisant, poursuivre les efforts en calcul."
              />
            </div>
            <PDFActions
              fileName={`bulletin-${eleve.matricule}-${periode}.pdf`}
              downloadLabel="Télécharger le bulletin"
              document={
                <BulletinDocument
                  data={{
                    nomEcole: config.nom_ecole ?? '',
                    logoUrl,
                    anneeScolaire: eleve.annee_scolaire,
                    eleveNom: eleve.nom,
                    elevePrenom: eleve.prenom,
                    matricule: eleve.matricule,
                    classe: eleve.classe_nom,
                    periode,
                    lignes: moyennes.map((m) => ({
                      matiere: notesPeriode.find((n) => n.matiere_id === m.matiere_id)?.matiere_nom ?? '',
                      coefficient: m.coefficient,
                      moyenne: m.moyenne,
                    })),
                    moyenneGenerale,
                    rang,
                    effectifClasse,
                    absencesNonJustifiees,
                    appreciation: appreciation || undefined,
                  }}
                />
              }
            />
          </div>
        ) : section === 'billet' ? (
          <div className="space-y-2">
            {absences.length === 0 && <p className="text-sm text-muted">Aucune absence enregistrée.</p>}
            <ul className="space-y-2">
              {absences.slice(0, 20).map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-input border border-border p-3 text-sm">
                  <span>{a.date_absence} — {a.type}</span>
                  <PDFActions
                    fileName={`billet-${eleve.prenom}-${a.date_absence}.pdf`}
                    downloadLabel="Télécharger le billet"
                    document={
                      <BilletDocument
                        data={{
                          nomEcole: config.nom_ecole ?? '',
                          logoUrl,
                          eleveNom: eleve.nom,
                          elevePrenom: eleve.prenom,
                          classe: eleve.classe_nom,
                          dateAbsence: a.date_absence,
                          type: a.type,
                          justifiee: !!a.justifiee,
                          motif: a.motif,
                        }}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : section === 'carte' ? (
          <PDFActions
            fileName={`carte-${eleve.matricule}.pdf`}
            downloadLabel="Télécharger la carte"
            document={
              <CarteDocument
                data={{
                  nomEcole: config.nom_ecole ?? '',
                  logoUrl,
                  photoUrl: eleve.photo_url,
                  eleveNom: eleve.nom,
                  elevePrenom: eleve.prenom,
                  classe: eleve.classe_nom,
                  matricule: eleve.matricule,
                  anneeScolaire: eleve.annee_scolaire,
                }}
              />
            }
          />
        ) : (
          <ConvocationForm eleve={eleve} config={config} logoUrl={logoUrl} />
        )}
      </div>
    </div>
  )
}

function ConvocationForm({ eleve, config, logoUrl }: { eleve: Eleve; config: Record<string, string>; logoUrl?: string }) {
  const [objet, setObjet] = useState('')
  const [date, setDate] = useState('')
  const [lieu, setLieu] = useState("Bureau de la direction")

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Objet</label>
        <input className="input-field" value={objet} onChange={(e) => setObjet(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Date</label>
        <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Lieu</label>
        <input className="input-field" value={lieu} onChange={(e) => setLieu(e.target.value)} />
      </div>
      <PDFActions
        fileName={`convocation-${eleve.prenom}.pdf`}
        downloadLabel="Télécharger la convocation"
        document={
          <ConvocationDocument
            data={{
              nomEcole: config.nom_ecole ?? '',
              logoUrl,
              directeurNom: config.directeur_nom ?? '',
              eleveNom: eleve.nom,
              elevePrenom: eleve.prenom,
              classe: eleve.classe_nom,
              objet,
              date,
              lieu,
            }}
          />
        }
      />
    </div>
  )
}
