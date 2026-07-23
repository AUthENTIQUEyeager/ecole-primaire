import Dexie, { type Table } from 'dexie'

export interface EleveCache {
  id: string
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  date_naissance: string
  lieu_naissance?: string
  classe_id: string
  classe_nom?: string
  whatsapp_parent: string
  nom_parent: string
  telephone_parent?: string
  statut_medical?: 'apte' | 'inapte'
  photo_url?: string
  matricule: string
  annee_scolaire: string
  actif: number
  statut_paiement?: string
}

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

export interface ConfigCache {
  key: string
  value: string
}

export interface PaiementCache {
  id: string
  eleve_id: string
  tranche: number
  montant_du: number
  montant_paye: number
  date_echeance: string
  statut: string
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

class EcolePrimaireDB extends Dexie {
  eleves!: Table<EleveCache, string>
  classes!: Table<ClasseCache, string>
  matieres!: Table<MatiereCache, string>
  config!: Table<ConfigCache, string>
  paiements!: Table<PaiementCache, string>
  syncQueue!: Table<QueueItem, string>

  constructor() {
    super('ecole_primaire_db')
    this.version(1).stores({
      eleves: 'id, classe_id, matricule, actif',
      classes: 'id, nom',
      matieres: 'id, code',
      config: 'key',
      paiements: 'id, eleve_id, statut',
      syncQueue: 'id, status, created_at',
    })
  }
}

export const localDB = typeof window !== 'undefined' ? new EcolePrimaireDB() : (null as any)
