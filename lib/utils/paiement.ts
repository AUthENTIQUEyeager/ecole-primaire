export type StatutPaiement =
  | 'en_attente'
  | 'en_cours'
  | 'en_retard_partiel'
  | 'en_retard_total'
  | 'soldee'

export const LABELS_STATUT: Record<StatutPaiement, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  en_retard_partiel: 'En retard partiel',
  en_retard_total: 'En retard total',
  soldee: 'Soldé',
}

export const COULEURS_STATUT: Record<StatutPaiement, string> = {
  en_attente: 'bg-slate-100 text-slate-600',
  en_cours: 'bg-amber-100 text-amber-700',
  en_retard_partiel: 'bg-orange-100 text-orange-700',
  en_retard_total: 'bg-red-100 text-red-700',
  soldee: 'bg-emerald-100 text-emerald-700',
}

/**
 * Calcule le statut d'une tranche selon le montant payé, le montant dû
 * et la date d'échéance. Doit être appelé après chaque versement.
 */
export function computeStatut(
  paye: number,
  du: number,
  echeance: string,
  today: Date = new Date()
): StatutPaiement {
  const deadline = new Date(echeance)
  if (paye >= du) return 'soldee'
  if (paye === 0 && today > deadline) return 'en_retard_total'
  if (paye > 0 && today > deadline) return 'en_retard_partiel'
  if (paye > 0) return 'en_cours'
  return 'en_attente'
}

export interface Tranche {
  id: string
  tranche: number
  montant_du: number
  montant_paye: number
  date_echeance: string
}

export interface RepartitionVersement {
  trancheId: string
  montantApplique: number
  nouveauMontantPaye: number
}

/**
 * Répartit un versement sur les tranches impayées, dans l'ordre, avec
 * débordement automatique vers la tranche suivante si le montant dépasse
 * le reste dû sur la tranche courante.
 */
/**
 * Répartit un versement sur les tranches impayées, en commençant par la
 * tranche choisie par l'utilisateur (startTranche), puis en débordant
 * automatiquement vers les tranches suivantes (dans l'ordre) si le montant
 * dépasse le reste dû sur la tranche de départ. Sans startTranche, on
 * commence par la première tranche impayée (comportement historique).
 */
export function repartirVersement(
  tranches: Tranche[],
  montantVersement: number,
  startTranche?: number
): RepartitionVersement[] {
  const parNumero = [...tranches].sort((a, b) => a.tranche - b.tranche)
  const ordonnees = startTranche
    ? [
        ...parNumero.filter((t) => t.tranche === startTranche),
        ...parNumero.filter((t) => t.tranche !== startTranche),
      ]
    : parNumero
  let reste = montantVersement
  const repartitions: RepartitionVersement[] = []

  for (const t of ordonnees) {
    if (reste <= 0) break
    const restantTranche = t.montant_du - t.montant_paye
    if (restantTranche <= 0) continue
    const applique = Math.min(reste, restantTranche)
    repartitions.push({
      trancheId: t.id,
      montantApplique: applique,
      nouveauMontantPaye: t.montant_paye + applique,
    })
    reste -= applique
  }

  return repartitions
}

export function formatFCFA(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} FCFA`
}
