import { z } from 'zod'

export const classeEnum = z.enum(['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'])

export const eleveSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  sexe: z.enum(['M', 'F'], { required_error: 'Le sexe est requis' }),
  date_naissance: z.string().min(1, 'La date de naissance est requise'),
  lieu_naissance: z.string().optional(),
  classe_id: z.string().min(1, 'La classe est requise'),
  whatsapp_parent: z
    .string()
    .min(8, 'Numéro WhatsApp invalide')
    .regex(/^\+?[0-9\s]{8,15}$/, 'Numéro WhatsApp invalide'),
  nom_parent: z.string().min(1, 'Le nom du parent est requis'),
  telephone_parent: z.string().optional(),
  statut_medical: z.enum(['apte', 'inapte']).optional(),
  photo_url: z.string().optional(),
})

export const absenceSchema = z.object({
  eleve_id: z.string().min(1),
  date_absence: z.string().min(1),
  type: z.enum(['absence', 'retard']),
  justifiee: z.boolean().default(false),
  motif: z.string().optional(),
})

export const noteSchema = z.object({
  id: z.string().optional(),
  eleve_id: z.string().min(1),
  matiere_id: z.string().min(1),
  enseignant_nom: z.string().optional(),
  valeur: z.number().min(0),
  note_sur: z.number().int().positive().default(20),
  type: z.enum(['devoir', 'composition', 'examen']),
  titre: z.string().optional(),
  periode: z.enum(['T1', 'T2', 'T3']),
  date_evaluation: z.string().min(1),
})

export const versementSchema = z.object({
  eleve_id: z.string().min(1),
  montant: z.number().int().positive('Le montant doit être positif'),
  date_versement: z.string().min(1),
  mode_paiement: z.enum(['especes', 'mobile_money', 'cheque']),
  caissier_nom: z.string().min(1),
  tranche_depart: z.number().int().min(1).max(3).optional(),
})

export const depenseSchema = z.object({
  categorie: z.enum(['salaires', 'fournitures', 'entretien', 'factures', 'loyer', 'imprevus', 'autre']),
  description: z.string().min(1),
  montant: z.number().int().positive(),
  date_depense: z.string().min(1),
  created_by_nom: z.string().min(1),
})

export const salaireSchema = z.object({
  enseignant_nom: z.string().min(1),
  matiere_principale: z.string().optional(),
  mois: z.string().min(1), // YYYY-MM
  salaire_net: z.number().int().positive(),
})

export const annonceSchema = z.object({
  titre: z.string().min(1),
  contenu: z.string().min(1),
  auteur_nom: z.string().min(1),
  priorite: z.enum(['normale', 'importante', 'urgente']).default('normale'),
  date_debut: z.string().min(1),
  date_fin: z.string().optional(),
})

export const configSchema = z.object({
  nom_ecole: z.string().min(1),
  directeur_nom: z.string().min(1),
  adresse: z.string().min(1),
  telephone: z.string().min(1),
  annee_scolaire: z.string().min(1),
  frais_annuels: z.number().int().positive(),
  tranche1_montant: z.number().int().positive(),
  tranche1_echeance: z.string().min(1),
  tranche2_montant: z.number().int().positive(),
  tranche2_echeance: z.string().min(1),
  tranche3_montant: z.number().int().positive(),
  tranche3_echeance: z.string().min(1),
  logo_url: z.string().optional(),
})

export const matiereSchema = z.object({
  nom: z.string().min(1),
  code: z.string().min(1),
  coefficient: z.number().int().positive(),
})

export const classeUpdateSchema = z.object({
  enseignant_principal: z.string().optional(),
})

export const classeCreateSchema = z.object({
  nom: z.enum(['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']),
  effectif_max: z.number().int().positive().optional(),
  enseignant_principal: z.string().optional(),
})

export const evenementSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(['sortie', 'cloture', 'autre']),
  description: z.string().optional(),
  montant_cotisation: z.number().int().positive(),
  date_evenement: z.string().min(1),
  // 'toutes' ou une liste d'ids de classes
  classes_ids: z.union([z.literal('toutes'), z.array(z.string().min(1)).min(1)]),
})

export const evenementVersementSchema = z.object({
  cotisation_id: z.string().min(1),
  eleve_id: z.string().min(1),
  evenement_id: z.string().min(1),
  montant: z.number().int().positive('Le montant doit être positif'),
  date_versement: z.string().min(1),
  mode_paiement: z.enum(['especes', 'mobile_money', 'cheque']),
  caissier_nom: z.string().min(1),
})

export const evenementDepenseSchema = z.object({
  evenement_id: z.string().min(1),
  categorie: z.string().min(1),
  description: z.string().min(1),
  montant: z.number().int().positive(),
  date_depense: z.string().min(1),
  created_by_nom: z.string().min(1),
})

export type EleveInput = z.infer<typeof eleveSchema>
export type AbsenceInput = z.infer<typeof absenceSchema>
export type NoteInput = z.infer<typeof noteSchema>
export type VersementInput = z.infer<typeof versementSchema>
export type DepenseInput = z.infer<typeof depenseSchema>
export type SalaireInput = z.infer<typeof salaireSchema>
export type AnnonceInput = z.infer<typeof annonceSchema>
export type EvenementInput = z.infer<typeof evenementSchema>
export type EvenementVersementInput = z.infer<typeof evenementVersementSchema>
export type EvenementDepenseInput = z.infer<typeof evenementDepenseSchema>
