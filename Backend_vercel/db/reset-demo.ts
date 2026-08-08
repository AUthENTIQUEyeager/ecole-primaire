import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

/**
 * Vide toutes les données opérationnelles (élèves, classes, notes, paiements,
 * absences, événements, dépenses, salaires, annonces, logs...) — c'est-à-dire
 * tout ce que db/seed.ts génère de façon aléatoire pour les tests.
 *
 * Volontairement CONSERVÉ (pas des données de démo, mais la config réelle) :
 *   - config   : nom de l'école, adresse, tranches de frais...
 *   - users    : comptes de connexion (admin, fondatrice)
 * Si tu veux aussi les réinitialiser, relance db:seed séparément — il les
 * recrée avec des valeurs par défaut (voir db/seed.ts).
 *
 * Irréversible : agit directement sur la base Turso de production définie
 * dans .env.local. Il faut passer --confirmer pour que le script agisse
 * réellement ; sans ce flag, il se contente d'afficher ce qu'il ferait.
 */

const TABLES_A_VIDER = [
  'evenement_versements',
  'evenement_depenses',
  'evenement_cotisations',
  'evenements',
  'sync_queue',
  'activity_log',
  'annonces',
  'salaires',
  'depenses',
  'versements',
  'paiements',
  'notes',
  'absences',
  'eleves',
  'matieres',
  'classes',
]

async function reset() {
  const confirme = process.argv.includes('--confirmer')

  const { db } = await import('../lib/db')

  const url = process.env.TURSO_DATABASE_URL ?? '(non défini)'
  console.log(`Base ciblée : ${url}`)
  console.log(confirme ? 'Mode réel — les données vont être supprimées.\n' : 'Mode simulation (ajoute --confirmer pour exécuter réellement).\n')

  let totalSupprime = 0

  for (const table of TABLES_A_VIDER) {
    const { rows } = await db.execute(`SELECT COUNT(*) as n FROM ${table}`)
    const n = Number(rows[0]?.n ?? 0)

    if (confirme) {
      await db.execute(`DELETE FROM ${table}`)
      console.log(`${table} : ${n} ligne(s) supprimée(s)`)
    } else {
      console.log(`${table} : ${n} ligne(s) seraient supprimées`)
    }
    totalSupprime += n
  }

  console.log(`\nTotal : ${totalSupprime} ligne(s) ${confirme ? 'supprimées' : 'à supprimer'}.`)
  if (!confirme) {
    console.log('Relance avec : npm run db:reset-demo -- --confirmer')
  }
}

reset().catch((err) => {
  console.error('Échec :', err)
  process.exit(1)
})