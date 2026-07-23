export interface NoteBrute {
  matiere_id: string
  coefficient: number
  valeur: number
  note_sur: number
}

export interface MoyenneMatiere {
  matiere_id: string
  coefficient: number
  moyenne: number // ramenée sur 20
}

/** Moyenne par matière = moyenne des notes de la matière, ramenée sur 20. */
export function calculerMoyennesParMatiere(notes: NoteBrute[]): MoyenneMatiere[] {
  const groupes = new Map<string, NoteBrute[]>()
  for (const n of notes) {
    const liste = groupes.get(n.matiere_id) ?? []
    liste.push(n)
    groupes.set(n.matiere_id, liste)
  }

  return Array.from(groupes.entries()).map(([matiere_id, liste]) => {
    const sur20 = liste.map((n) => (n.valeur / n.note_sur) * 20)
    const moyenne = sur20.reduce((a, b) => a + b, 0) / sur20.length
    return { matiere_id, coefficient: liste[0].coefficient, moyenne }
  })
}

/** Moyenne générale = somme(moyenne_matière × coefficient) / somme(coefficients). */
export function calculerMoyenneGenerale(moyennes: MoyenneMatiere[]): number {
  const totalCoef = moyennes.reduce((a, m) => a + m.coefficient, 0)
  if (totalCoef === 0) return 0
  const somme = moyennes.reduce((a, m) => a + m.moyenne * m.coefficient, 0)
  return somme / totalCoef
}

export interface EleveMoyenne {
  eleve_id: string
  moyenneGenerale: number
}

/** Classement décroissant (1 = meilleure moyenne). */
export function calculerRangs(eleves: EleveMoyenne[]): Map<string, number> {
  const tries = [...eleves].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
  const rangs = new Map<string, number>()
  tries.forEach((e, i) => rangs.set(e.eleve_id, i + 1))
  return rangs
}
