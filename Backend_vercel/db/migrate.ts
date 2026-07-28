import { config } from 'dotenv'
config({ path: '.env.local' })

async function migrate() {
  // Import dynamique : garantit que dotenv a chargé .env.local AVANT que
  // lib/db.ts lise process.env (les imports statiques sont remontés en haut
  // du fichier par TypeScript, ce qui casserait l'ordre de chargement ici).
  const { readFileSync } = await import('fs')
  const { join } = await import('path')
  const { db } = await import('../lib/db')

  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    await db.execute(statement)
  }
  console.log(`Migration terminée — ${statements.length} instructions exécutées.`)
}

migrate().catch((err) => {
  console.error('Échec de la migration :', err)
  process.exit(1)
})
