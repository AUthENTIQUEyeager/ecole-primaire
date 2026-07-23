import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

const ANNEE = '2024-2025'

const CLASSES = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'] as const

const MATIERES = [
  { nom: 'Lecture-Écriture', code: 'LEC', coefficient: 4 },
  { nom: 'Calcul', code: 'CAL', coefficient: 4 },
  { nom: "Sciences d'Éveil", code: 'SCI', coefficient: 2 },
  { nom: 'Histoire-Géographie', code: 'HG', coefficient: 2 },
  { nom: 'Éducation Civique', code: 'EC', coefficient: 1 },
  { nom: 'Anglais', code: 'ANG', coefficient: 2 },
  { nom: 'EPS', code: 'EPS', coefficient: 1 },
  { nom: 'Dessin-Travaux Manuels', code: 'DTM', coefficient: 1 },
]

const ENSEIGNANTS = [
  { nom: 'Ismaël OUEDRAOGO', matiere: 'Lecture-Écriture' },
  { nom: 'Aïcha KABORE', matiere: 'Calcul' },
  { nom: 'Boubacar ZONGO', matiere: "Sciences d'Éveil" },
  { nom: 'Rasmata SAWADOGO', matiere: 'Histoire-Géographie' },
  { nom: 'Salif TRAORE', matiere: 'Anglais' },
  { nom: 'Mariam COMPAORE', matiere: 'EPS' },
]

const PRENOMS_M = ['Ibrahim', 'Boureima', 'Issa', 'Moussa', 'Abdoulaye', 'Seydou', 'Rasmané', 'Yacouba', 'Karim', 'Adama', 'Souleymane', 'Harouna', 'Idrissa', 'Amadou']
const PRENOMS_F = ['Aminata', 'Fatoumata', 'Mariam', 'Awa', 'Rasmata', 'Bintou', 'Salamata', 'Aïssata', 'Rokia', 'Djeneba', 'Kadidia', 'Aicha', 'Nafissatou', 'Zenabou']
const NOMS = ['TRAORE', 'OUEDRAOGO', 'SAWADOGO', 'KABORE', 'ZONGO', 'COMPAORE', 'KONE', 'COULIBALY', 'SANOU', 'BAMBARA', 'KIENTEGA', 'NIKIEMA', 'TAPSOBA', 'YAMEOGO']

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function ageRangePourClasse(classe: string): [number, number] {
  switch (classe) {
    case 'CP1': return [6, 7]
    case 'CP2': return [7, 8]
    case 'CE1': return [8, 9]
    case 'CE2': return [9, 10]
    case 'CM1': return [10, 11]
    case 'CM2': return [11, 12]
    default: return [6, 12]
  }
}

async function seed() {
  // Import dynamique : garantit que dotenv a chargé .env.local avant que
  // lib/db.ts lise process.env (les imports statiques seraient remontés en
  // haut du fichier par TypeScript, ce qui casserait l'ordre de chargement).
  const { randomUUID } = await import('crypto')
  const { default: bcrypt } = await import('bcryptjs')
  const { db } = await import('../lib/db')
  const { genererNumeroRecu } = await import('../lib/utils/recu')

  console.log('Suppression des données existantes...')
  const tables = ['sync_queue', 'activity_log', 'annonces', 'salaires', 'depenses', 'versements', 'paiements', 'notes', 'absences', 'eleves', 'matieres', 'classes', 'config', 'users']
  for (const t of tables) {
    await db.execute(`DELETE FROM ${t}`)
  }

  console.log('Configuration...')
  const config: Record<string, string> = {
    nom_ecole: 'École Primaire Privée Les Étoiles',
    directeur_nom: 'Adama SAWADOGO',
    adresse: 'Secteur 8, Bobo-Dioulasso, Burkina Faso',
    telephone: '+226 20 97 00 00',
    annee_scolaire: ANNEE,
    frais_annuels: '35000',
    tranche1_montant: '15000',
    tranche1_echeance: '2024-10-15',
    tranche2_montant: '12000',
    tranche2_echeance: '2025-01-15',
    tranche3_montant: '8000',
    tranche3_echeance: '2025-04-15',
  }
  for (const [key, value] of Object.entries(config)) {
    await db.execute({ sql: `INSERT INTO config (key, value) VALUES (?, ?)`, args: [key, value] })
  }

  console.log('Comptes utilisateurs...')
  const adminHash = await bcrypt.hash('Admin2024!', 10)
  const fondatriceHash = await bcrypt.hash('Fond2024!', 10)
  await db.execute({
    sql: `INSERT INTO users (id, nom, prenom, email, password_hash, role, actif) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [randomUUID(), 'SAWADOGO', 'Adama', 'admin@etoiles-bobo.bf', adminHash, 'admin'],
  })
  await db.execute({
    sql: `INSERT INTO users (id, nom, prenom, email, password_hash, role, actif) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [randomUUID(), 'OUEDRAOGO', 'Fatimata', 'fondatrice@etoiles-bobo.bf', fondatriceHash, 'fondateur'],
  })

  console.log('Classes...')
  const classeIds: Record<string, string> = {}
  for (const nom of CLASSES) {
    const id = randomUUID()
    classeIds[nom] = id
    await db.execute({
      sql: `INSERT INTO classes (id, nom, effectif_max, enseignant_principal, annee_scolaire) VALUES (?, ?, 40, ?, ?)`,
      args: [id, nom, pick(ENSEIGNANTS).nom, ANNEE],
    })
  }

  console.log('Matières...')
  const matiereIds: Record<string, string> = {}
  for (const m of MATIERES) {
    const id = randomUUID()
    matiereIds[m.code] = id
    await db.execute({
      sql: `INSERT INTO matieres (id, nom, code, coefficient) VALUES (?, ?, ?, ?)`,
      args: [id, m.nom, m.code, m.coefficient],
    })
  }

  console.log('30 élèves...')
  const eleveIds: { id: string; classe: string }[] = []
  let matriculeCounter = 1
  for (let i = 0; i < 30; i++) {
    const classe = CLASSES[i % CLASSES.length]
    const sexe = Math.random() > 0.5 ? 'M' : 'F'
    const prenom = sexe === 'M' ? pick(PRENOMS_M) : pick(PRENOMS_F)
    const nom = pick(NOMS)
    const [ageMin, ageMax] = ageRangePourClasse(classe)
    const age = randInt(ageMin, ageMax)
    const naissance = new Date(2024 - age, randInt(0, 11), randInt(1, 28)).toISOString().slice(0, 10)
    const id = randomUUID()
    const matricule = `EC-2024-${String(matriculeCounter++).padStart(4, '0')}`
    const whatsapp = `+226 7${randInt(0, 9)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`

    await db.execute({
      sql: `INSERT INTO eleves
        (id, nom, prenom, sexe, date_naissance, lieu_naissance, classe_id, whatsapp_parent,
         nom_parent, telephone_parent, statut_medical, matricule, annee_scolaire, actif)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        id, nom, prenom, sexe, naissance, 'Bobo-Dioulasso', classeIds[classe], whatsapp,
        `${pick(NOMS)} ${sexe === 'M' ? pick(PRENOMS_F) : pick(PRENOMS_M)}`, whatsapp, 'apte', matricule, ANNEE,
      ],
    })
    eleveIds.push({ id, classe })

    // 3 tranches de paiement par élève, avec statuts variés
    const tranches = [
      { n: 1, montant: 15000, echeance: '2024-10-15' },
      { n: 2, montant: 12000, echeance: '2025-01-15' },
      { n: 3, montant: 8000, echeance: '2025-04-15' },
    ]
    for (const t of tranches) {
      const paiementId = randomUUID()
      // Variation : certains élèves à jour, d'autres en retard
      let paye = 0
      let statut = 'en_attente'
      const roll = Math.random()
      if (t.n === 1) {
        if (roll < 0.5) { paye = t.montant; statut = 'soldee' }
        else if (roll < 0.75) { paye = randInt(3000, t.montant - 1000); statut = 'en_cours' }
        else { paye = 0; statut = 'en_retard_total' }
      }
      await db.execute({
        sql: `INSERT INTO paiements (id, eleve_id, annee_scolaire, tranche, montant_du, montant_paye, date_echeance, statut)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [paiementId, id, ANNEE, t.n, t.montant, paye, t.echeance, statut],
      })
      if (paye > 0) {
        await db.execute({
          sql: `INSERT INTO versements (id, eleve_id, paiement_id, montant, date_versement, mode_paiement, numero_recu, caissier_nom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [randomUUID(), id, paiementId, paye, '2024-10-05', pick(['especes', 'mobile_money', 'cheque']), genererNumeroRecu(new Date('2024-10-05')), 'Adama SAWADOGO'],
        })
      }
    }
  }

  console.log('15 absences...')
  for (let i = 0; i < 15; i++) {
    const eleve = pick(eleveIds)
    await db.execute({
      sql: `INSERT INTO absences (id, eleve_id, date_absence, type, justifiee, motif, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(), eleve.id,
        new Date(2024, 10, randInt(1, 28)).toISOString().slice(0, 10),
        Math.random() > 0.3 ? 'absence' : 'retard',
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 'Maladie' : null,
        'Adama SAWADOGO',
      ],
    })
  }

  console.log('20 notes (T1)...')
  const matiereCodes = Object.keys(matiereIds)
  for (let i = 0; i < 20; i++) {
    const eleve = pick(eleveIds)
    const code = pick(matiereCodes)
    await db.execute({
      sql: `INSERT INTO notes (id, eleve_id, matiere_id, enseignant_nom, valeur, note_sur, type, titre, periode, date_evaluation)
            VALUES (?, ?, ?, ?, ?, 20, ?, ?, 'T1', ?)`,
      args: [
        randomUUID(), eleve.id, matiereIds[code], pick(ENSEIGNANTS).nom,
        randInt(8, 20), pick(['devoir', 'composition', 'examen']), 'Évaluation trimestrielle',
        new Date(2024, 10, randInt(1, 28)).toISOString().slice(0, 10),
      ],
    })
  }

  console.log('5 dépenses...')
  const depenses = [
    { cat: 'fournitures', desc: 'Achat de craies et cahiers', montant: 45000 },
    { cat: 'entretien', desc: 'Réparation des sanitaires', montant: 60000 },
    { cat: 'factures', desc: 'Facture eau et électricité', montant: 85000 },
    { cat: 'loyer', desc: 'Loyer mensuel des locaux', montant: 150000 },
    { cat: 'imprevus', desc: 'Réparation portail', montant: 25000 },
  ]
  for (const d of depenses) {
    await db.execute({
      sql: `INSERT INTO depenses (id, categorie, description, montant, date_depense, created_by_nom)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), d.cat, d.desc, d.montant, '2024-11-10', 'Adama SAWADOGO'],
    })
  }

  console.log('Salaires (3 mois, 6 enseignants)...')
  for (const mois of ['2024-09', '2024-10', '2024-11']) {
    for (const e of ENSEIGNANTS) {
      const statut = mois === '2024-11' && Math.random() > 0.6 ? 'en_attente' : 'paye'
      await db.execute({
        sql: `INSERT INTO salaires (id, enseignant_nom, matiere_principale, mois, salaire_net, statut, date_paiement, mode_paiement)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), e.nom, e.matiere, mois, randInt(60000, 90000), statut, statut === 'paye' ? `${mois}-28` : null, statut === 'paye' ? 'especes' : null],
      })
    }
  }

  console.log('5 annonces...')
  const annonces = [
    { titre: 'Réunion des parents d’élèves', contenu: 'Une réunion générale des parents se tiendra le 30 novembre à 9h.', priorite: 'importante' },
    { titre: 'Rentrée du 2ème trimestre', contenu: 'La rentrée du 2ème trimestre est fixée au 6 janvier 2025.', priorite: 'normale' },
    { titre: 'Campagne de vaccination', contenu: "Une campagne de vaccination scolaire aura lieu la semaine prochaine.", priorite: 'urgente' },
    { titre: 'Fête de fin d’année', contenu: 'La fête de fin d’année scolaire se prépare, plus de détails à venir.', priorite: 'normale' },
    { titre: 'Rappel des frais de scolarité', contenu: 'Merci de régulariser les tranches en retard avant le 15 décembre.', priorite: 'importante' },
  ]
  for (const a of annonces) {
    await db.execute({
      sql: `INSERT INTO annonces (id, titre, contenu, auteur_nom, priorite, date_debut)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), a.titre, a.contenu, 'Adama SAWADOGO', a.priorite, '2024-11-15'],
    })
  }

  console.log('Journal d’activité...')
  await db.execute({
    sql: `INSERT INTO activity_log (id, action_type, description_fr) VALUES (?, ?, ?)`,
    args: [randomUUID(), 'seed', 'Données de démonstration initialisées'],
  })

  console.log('\n✅ Seed terminé.')
  console.log('   Admin      : admin@etoiles-bobo.bf / Admin2024!')
  console.log('   Fondatrice : fondatrice@etoiles-bobo.bf / Fond2024!')
}

seed().catch((err) => {
  console.error('Échec du seed :', err)
  process.exit(1)
})
