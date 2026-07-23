/**
 * Génère un numéro de reçu au format REC-YYYYMMDD-XXXX (suffixe aléatoire à 4 chiffres).
 * L'unicité est garantie par la contrainte UNIQUE en base ; en cas de collision
 * improbable, l'appelant doit réessayer l'insertion.
 */
export function genererNumeroRecu(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `REC-${y}${m}${d}-${suffix}`
}
