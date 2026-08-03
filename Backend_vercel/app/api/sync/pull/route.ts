import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * Synchronisation complète en un seul aller-retour : renvoie toutes les
 * tables nécessaires au fonctionnement hors ligne de l'interface admin.
 *
 * Volontairement un "full pull" plutôt qu'une synchro incrémentale par
 * horodatage : pour la taille de données d'une école primaire (quelques
 * centaines d'élèves, quelques milliers de lignes au total), un pull complet
 * est plus simple ET plus robuste sur une connexion qui coupe en cours de
 * route — pas d'état "à moitié synchronisé" à gérer.
 */
export async function GET(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const [
    classes,
    matieres,
    eleves,
    notes,
    absences,
    paiements,
    versements,
    depenses,
    salaires,
    annonces,
    config,
    evenements,
    evenementCotisations,
    evenementVersements,
    evenementDepenses,
  ] = await Promise.all([
    db.execute(`SELECT * FROM classes`),
    db.execute(`SELECT * FROM matieres`),
    db.execute(`SELECT * FROM eleves WHERE actif = 1`),
    db.execute(`SELECT * FROM notes`),
    db.execute(`SELECT * FROM absences`),
    db.execute(`SELECT * FROM paiements`),
    db.execute(`SELECT * FROM versements`),
    db.execute(`SELECT * FROM depenses`),
    db.execute(`SELECT * FROM salaires`),
    db.execute(`SELECT * FROM annonces`),
    db.execute(`SELECT key, value FROM config`),
    db.execute(`SELECT * FROM evenements`),
    db.execute(`SELECT * FROM evenement_cotisations`),
    db.execute(`SELECT * FROM evenement_versements`),
    db.execute(`SELECT * FROM evenement_depenses`),
  ])

  return NextResponse.json({
    classes: classes.rows,
    matieres: matieres.rows,
    eleves: eleves.rows,
    notes: notes.rows,
    absences: absences.rows,
    paiements: paiements.rows,
    versements: versements.rows,
    depenses: depenses.rows,
    salaires: salaires.rows,
    annonces: annonces.rows,
    config: config.rows,
    evenements: evenements.rows,
    evenementCotisations: evenementCotisations.rows,
    evenementVersements: evenementVersements.rows,
    evenementDepenses: evenementDepenses.rows,
    syncedAt: new Date().toISOString(),
  })
}
