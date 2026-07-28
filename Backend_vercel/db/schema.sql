-- ============================================================
-- École Primaire Privée Les Étoiles — schéma Turso (libSQL/SQLite)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'fondateur')),
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL CHECK (nom IN ('CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2')),
  effectif_max INTEGER NOT NULL DEFAULT 40,
  enseignant_principal TEXT,
  annee_scolaire TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matieres (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  coefficient INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS eleves (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
  date_naissance TEXT NOT NULL,
  lieu_naissance TEXT,
  classe_id TEXT NOT NULL REFERENCES classes(id),
  whatsapp_parent TEXT NOT NULL,
  nom_parent TEXT NOT NULL,
  telephone_parent TEXT,
  statut_medical TEXT CHECK (statut_medical IN ('apte', 'inapte')),
  photo_url TEXT,
  matricule TEXT NOT NULL UNIQUE,
  annee_scolaire TEXT NOT NULL,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  matiere_id TEXT NOT NULL REFERENCES matieres(id),
  enseignant_nom TEXT,
  valeur REAL NOT NULL,
  note_sur INTEGER NOT NULL DEFAULT 20,
  type TEXT NOT NULL CHECK (type IN ('devoir', 'composition', 'examen')),
  titre TEXT,
  periode TEXT NOT NULL CHECK (periode IN ('T1', 'T2', 'T3')),
  date_evaluation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS absences (
  id TEXT PRIMARY KEY,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  date_absence TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('absence', 'retard')),
  justifiee INTEGER NOT NULL DEFAULT 0,
  motif TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS paiements (
  id TEXT PRIMARY KEY,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  annee_scolaire TEXT NOT NULL,
  tranche INTEGER NOT NULL CHECK (tranche IN (1, 2, 3)),
  montant_du INTEGER NOT NULL,
  montant_paye INTEGER NOT NULL DEFAULT 0,
  date_echeance TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'en_cours', 'en_retard_partiel', 'en_retard_total', 'soldee')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS versements (
  id TEXT PRIMARY KEY,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  paiement_id TEXT NOT NULL REFERENCES paiements(id),
  montant INTEGER NOT NULL,
  date_versement TEXT NOT NULL,
  mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('especes', 'mobile_money', 'cheque')),
  numero_recu TEXT NOT NULL UNIQUE,
  caissier_nom TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS depenses (
  id TEXT PRIMARY KEY,
  categorie TEXT NOT NULL CHECK (categorie IN ('salaires', 'fournitures', 'entretien', 'factures', 'loyer', 'imprevus', 'autre')),
  description TEXT NOT NULL,
  montant INTEGER NOT NULL,
  date_depense TEXT NOT NULL,
  created_by_nom TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salaires (
  id TEXT PRIMARY KEY,
  enseignant_nom TEXT NOT NULL,
  matiere_principale TEXT,
  mois TEXT NOT NULL,
  salaire_net INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye')),
  date_paiement TEXT,
  mode_paiement TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS annonces (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  auteur_nom TEXT NOT NULL,
  priorite TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('normale', 'importante', 'urgente')),
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for the three highest-frequency lookups
CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule);
CREATE INDEX IF NOT EXISTS idx_absences_eleve_date ON absences(eleve_id, date_absence);
CREATE INDEX IF NOT EXISTS idx_paiements_eleve ON paiements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_versements_eleve ON versements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_notes_eleve_periode ON notes(eleve_id, periode);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
