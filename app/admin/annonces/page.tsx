import { db } from '@/lib/db'
import { AnnoncesView } from '@/components/annonces/AnnoncesView'

export const dynamic = 'force-dynamic'

export default async function AnnoncesPage() {
  const result = await db.execute(`SELECT * FROM annonces ORDER BY created_at DESC`)
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Annonces</h1>
      <AnnoncesView annonces={result.rows as any[]} />
    </div>
  )
}
