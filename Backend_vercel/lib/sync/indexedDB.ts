import Dexie, { type Table } from 'dexie'

// Chaque interface reflète exactement une table du schéma Turso (db/schema.sql).
// Le local (IndexedDB) est désormais la SOURCE DE VÉRITÉ pour l'interface admin :
// toutes les pages lisent ces tables, jamais Turso directement au rendu.

export interface ClasseCache {
  id: string
  nom: string
  effectif_max: number
  enseignant_principal?: string
  annee_scolaire: string
}

export interface MatiereCache {
  id: string
  nom: string
  code: string
  coefficient: number
}

export interface EleveCache {
  id: string
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  date_naissance: string
  lieu_naissance?: string
  classe_id: string
  whatsapp_parent: string
  nom_parent: string
  telephone_parent?: string
  statut_medical?: 'apte' | 'inapte'
  photo_url?: string
  matricule: string
  annee_scolaire: string
  actif: number
}

export interface NoteCache {
  id: string
  eleve_id: string
  matiere_id: string
  enseignant_nom?: string
  valeur: number
  note_sur: number
  type: 'devoir' | 'composition' | 'examen'
  titre?: string
  periode: 'T1' | 'T2' | 'T3'
  date_evaluation: string
}

export interface AbsenceCache {
  id: string
  eleve_id: string
  date_absence: string
  type: 'absence' | 'retard'
  justifiee: number
  motif?: string
  created_by?: string
}

export interface PaiementCache {
  id: string
  eleve_id: string
  annee_scolaire: string
  tranche: number
  montant_du: number
  montant_paye: number
  date_echeance: string
  statut: string
}

export interface VersementCache {
  id: string
  eleve_id: string
  paiement_id: string
  montant: number
  date_versement: string
  mode_paiement: 'especes' | 'mobile_money' | 'cheque'
  numero_recu: string
  caissier_nom: string
}

export interface DepenseCache {
  id: string
  categorie: string
  description: string
  montant: number
  date_depense: string
  created_by_nom: string
}

export interface SalaireCache {
  id: string
  enseignant_nom: string
  matiere_principale?: string
  mois: string
  salaire_net: number
  statut: 'en_attente' | 'paye'
  date_paiement?: string
  mode_paiement?: string
}

export interface AnnonceCache {
  id: string
  titre: string
  contenu: string
  auteur_nom: string
  priorite: 'normale' | 'importante' | 'urgente'
  date_debut: string
  date_fin?: string
  created_at?: string
}

export interface ConfigCache {
  key: string
  value: string
}

export interface EvenementCache {
  id: string
  nom: string
  type: 'sortie' | 'cloture' | 'autre'
  description?: string
  montant_cotisation: number
  date_evenement: string
  classes_ids: string
  statut: 'actif' | 'cloture'
}

export interface EvenementCotisationCache {
  id: string
  evenement_id: string
  eleve_id: string
  montant_du: number
  montant_paye: number
  statut: string
}

export interface EvenementVersementCache {
  id: string
  cotisation_id: string
  eleve_id: string
  evenement_id: string
  montant: number
  date_versement: string
  mode_paiement: 'especes' | 'mobile_money' | 'cheque'
  numero_recu: string
  caissier_nom: string
}

export interface EvenementDepenseCache {
  id: string
  evenement_id: string
  categorie: string
  description: string
  montant: number
  date_depense: string
  created_by_nom: string
}

export interface QueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  payload: unknown
  status: 'pending' | 'synced' | 'failed'
  created_at: string
  synced_at?: string
}

/** Horodatages / drapeaux divers (ex : dernière synchro complète réussie). */
export interface MetaCache {
  key: string
  value: string
}

class EcolePrimaireDB extends Dexie {
  classes!: Table<ClasseCache, string>
  matieres!: Table<MatiereCache, string>
  eleves!: Table<EleveCache, string>
  notes!: Table<NoteCache, string>
  absences!: Table<AbsenceCache, string>
  paiements!: Table<PaiementCache, string>
  versements!: Table<VersementCache, string>
  depenses!: Table<DepenseCache, string>
  salaires!: Table<SalaireCache, string>
  annonces!: Table<AnnonceCache, string>
  config!: Table<ConfigCache, string>
  syncQueue!: Table<QueueItem, string>
  meta!: Table<MetaCache, string>
  evenements!: Table<EvenementCache, string>
  evenementCotisations!: Table<EvenementCotisationCache, string>
  evenementVersements!: Table<EvenementVersementCache, string>
  evenementDepenses!: Table<EvenementDepenseCache, string>

  constructor() {
    super('ecole_primaire_db')

    // v1 conservée pour ne pas casser les installations déjà en place chez
    // les utilisatrices actuelles (Dexie migre automatiquement à l'ouverture).
    // v2 ajoute les tables manquantes (notes, absences, versements, depenses,
    // salaires, annonces, meta) — nécessaires pour que TOUT l'admin fonctionne
    // hors ligne, pas seulement élèves/classes/matières/config/paiements.
    this.version(1).stores({
      eleves: 'id, classe_id, matricule, actif',
      classes: 'id, nom',
      matieres: 'id, code',
      config: 'key',
      paiements: 'id, eleve_id, statut',
      syncQueue: 'id, status, created_at',
    })

    this.version(2).stores({
      eleves: 'id, classe_id, matricule, actif',
      classes: 'id, nom',
      matieres: 'id, code',
      config: 'key',
      paiements: 'id, eleve_id, statut',
      syncQueue: 'id, status, created_at',
      notes: 'id, eleve_id, matiere_id, periode',
      absences: 'id, eleve_id, date_absence, type',
      versements: 'id, eleve_id, paiement_id, date_versement',
      depenses: 'id, categorie, date_depense',
      salaires: 'id, mois, statut',
      annonces: 'id, date_debut',
      meta: 'key',
    })

    // v3 ajoute les tables "événements" (sorties, clôtures) : cotisations à
    // montant fixe réglables en plusieurs versements, plus les dépenses
    // propres à chaque événement (pour calculer son solde).
    this.version(3).stores({
      eleves: 'id, classe_id, matricule, actif',
      classes: 'id, nom',
      matieres: 'id, code',
      config: 'key',
      paiements: 'id, eleve_id, statut',
      syncQueue: 'id, status, created_at',
      notes: 'id, eleve_id, matiere_id, periode',
      absences: 'id, eleve_id, date_absence, type',
      versements: 'id, eleve_id, paiement_id, date_versement',
      depenses: 'id, categorie, date_depense',
      salaires: 'id, mois, statut',
      annonces: 'id, date_debut',
      meta: 'key',
      evenements: 'id, statut, date_evenement',
      evenementCotisations: 'id, evenement_id, eleve_id, statut',
      evenementVersements: 'id, evenement_id, cotisation_id, eleve_id',
      evenementDepenses: 'id, evenement_id, categorie',
    })
  }
}

// Typé comme non-nul pour que tous les appels `localDB.table.xxx()` gardent
// leur typage fort (sinon TypeScript propage `any` partout à cause du
// ternaire). En pratique, chaque appelant vérifie déjà `if (!localDB) return`
// avant d'utiliser localDB, donc la valeur `null` côté serveur reste sûre.
export const localDB: EcolePrimaireDB =
  typeof window !== 'undefined' ? new EcolePrimaireDB() : (null as unknown as EcolePrimaireDB)
