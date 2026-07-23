import { db } from '@/lib/db'
import { ClassesGrid } from '@/components/classes/ClassesGrid'

export const dynamic = 'force-dynamic'

async function getClasses() {
  const result = await db.execute(`
    SELECT c.*, (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id AND e.actif = 1) as effectif
    FROM classes c
    ORDER BY CASE c.nom WHEN 'CP1' THEN 1 WHEN 'CP2' THEN 2 WHEN 'CE1' THEN 3
      WHEN 'CE2' THEN 4 WHEN 'CM1' THEN 5 WHEN 'CM2' THEN 6 END
  `)
  return result.rows
}

export default async function ClassesPage() {
  const classes = await getClasses()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Classes</h1>
      <ClassesGrid classes={classes as any[]} />
    </div>
  )
}
