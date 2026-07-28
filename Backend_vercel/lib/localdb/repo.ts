import { localDB } from '@/lib/sync/indexedDB'
import { mutate, genererId } from '@/lib/sync/syncManager'
import { repartirVersement, computeStatut, type Tranche } from '@/lib/utils/paiement'

// ---------------------------------------------------------------------------
// Élèves
// ---------------------------------------------------------------------------

export const eleveRepo = {
  async create(payload: {
    nom: string
    prenom: string
    sexe: string
    date_naissance: string
    lieu_naissance?: string
    classe_id: string
    whatsapp_parent: string
    nom_parent: string
    telephone_parent?: string
    statut_medical?: string
    photo_url?: string
  }) {
    const id = genererId()
    const config = localDB ? Object.fromEntries((await localDB.config.toArray()).map((c) => [c.key, c.value])) : {}
    const anneeScolaire = config.annee_scolaire ?? new Date().getFullYear().toString()

    if (localDB) {
      await localDB.eleves.put({
        ...payload,
        id,
        photo_url: payload.photo_url,
        matricule: 'En attente de synchronisation',
        annee_scolaire: anneeScolaire,
        actif: 1,
      } as any)

      const tranches = [
        { n: 1, montant: Number(config.tranche1_montant ?? 15000), echeance: config.tranche1_echeance ?? '' },
        { n: 2, montant: Number(config.tranche2_montant ?? 12000), echeance: config.tranche2_echeance ?? '' },
        { n: 3, montant: Number(config.tranche3_montant ?? 8000), echeance: config.tranche3_echeance ?? '' },
      ]
      await localDB.paiements.bulkPut(
        tranches.map((t) => ({
          id: genererId(),
          eleve_id: id,
          annee_scolaire: anneeScolaire,
          tranche: t.n,
          montant_du: t.montant,
          montant_paye: 0,
          date_echeance: t.echeance,
          statut: 'en_attente',
        }))
      )
    }

    const res = await mutate({ endpoint: '/api/eleves', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, matricule: res?.matricule as string | undefined, queued: !!res?.queued, error: !!res?.error, details: res?.details }
  },

  async update(id: string, payload: Record<string, any>) {
    if (localDB) await localDB.eleves.update(id, payload)
    const res = await mutate({ endpoint: `/api/eleves/${id}`, method: 'PUT', operation: 'UPDATE', payload })
    return { queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const classeRepo = {
  async updateEnseignant(id: string, enseignant_principal: string | undefined) {
    if (localDB) await localDB.classes.update(id, { enseignant_principal })
    const res = await mutate({
      endpoint: `/api/classes/${id}`,
      method: 'PUT',
      operation: 'UPDATE',
      payload: { enseignant_principal },
    })
    return { queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Absences
// ---------------------------------------------------------------------------

export const absenceRepo = {
  async create(payload: { eleve_id: string; date_absence: string; type: 'absence' | 'retard'; justifiee?: boolean; motif?: string }) {
    const id = genererId()
    if (localDB) {
      await localDB.absences.put({ ...payload, id, justifiee: payload.justifiee ? 1 : 0 } as any)
    }
    const res = await mutate({ endpoint: '/api/absences', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const noteRepo = {
  async createBatch(
    notes: {
      eleve_id: string
      matiere_id: string
      valeur: number
      note_sur: number
      type: 'devoir' | 'composition' | 'examen'
      periode: 'T1' | 'T2' | 'T3'
      date_evaluation: string
    }[]
  ) {
    const avecId = notes.map((n) => ({ ...n, id: genererId() }))
    if (localDB) await localDB.notes.bulkPut(avecId as any)
    const res = await mutate({ endpoint: '/api/notes', method: 'POST', operation: 'INSERT', payload: avecId })
    return { count: avecId.length, queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Versements / paiements
// ---------------------------------------------------------------------------

export const versementRepo = {
  /** Enregistre un versement : répartit sur les tranches impayées (avec débordement), met à jour les tranches et insère le versement, localement ET côté serveur. */
  async create(input: {
    eleve_id: string
    montant: number
    date_versement: string
    mode_paiement: 'especes' | 'mobile_money' | 'cheque'
    caissier_nom: string
    tranche_depart?: number
  }) {
    if (!localDB) return { error: true }

    const tranchesImpayees = (await localDB.paiements.where('eleve_id').equals(input.eleve_id).toArray()).filter(
      (t) => t.statut !== 'soldee'
    ) as unknown as Tranche[]

    if (tranchesImpayees.length === 0) {
      return { error: true, details: 'Toutes les tranches sont déjà soldées' }
    }

    const repartitions = repartirVersement(tranchesImpayees, input.montant, input.tranche_depart)
    const today = new Date(input.date_versement)

    for (const r of repartitions) {
      const tranche = tranchesImpayees.find((t) => t.id === r.trancheId)!
      const statut = computeStatut(r.nouveauMontantPaye, tranche.montant_du, tranche.date_echeance, today)
      await localDB.paiements.update(r.trancheId, { montant_paye: r.nouveauMontantPaye, statut })
    }

    const id = genererId()
    await localDB.versements.put({
      id,
      eleve_id: input.eleve_id,
      paiement_id: repartitions[0].trancheId,
      montant: input.montant,
      date_versement: input.date_versement,
      mode_paiement: input.mode_paiement,
      numero_recu: 'En attente de synchronisation',
      caissier_nom: input.caissier_nom,
    } as any)

    const res = await mutate({ endpoint: '/api/versements', method: 'POST', operation: 'INSERT', payload: { ...input, id } })

    // En ligne : le serveur a généré le vrai numéro de reçu — on le reporte localement.
    if (!res?.error && !res?.queued && res?.numero_recu) {
      await localDB.versements.update(id, { numero_recu: res.numero_recu })
    }

    const nouvellesTranches = await localDB.paiements.where('eleve_id').equals(input.eleve_id).toArray()

    return {
      id,
      numeroRecu: res?.numero_recu,
      nouvellesTranches,
      queued: !!res?.queued,
      error: !!res?.error,
    }
  },
}

// ---------------------------------------------------------------------------
// Dépenses
// ---------------------------------------------------------------------------

export const depenseRepo = {
  async create(payload: { categorie: string; description: string; montant: number; date_depense: string; created_by_nom: string }) {
    const id = genererId()
    if (localDB) await localDB.depenses.put({ ...payload, id } as any)
    const res = await mutate({ endpoint: '/api/depenses', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Salaires
// ---------------------------------------------------------------------------

export const salaireRepo = {
  async create(payload: { enseignant_nom: string; matiere_principale?: string; mois: string; salaire_net: number }) {
    const id = genererId()
    if (localDB) await localDB.salaires.put({ ...payload, id, statut: 'en_attente' } as any)
    const res = await mutate({ endpoint: '/api/salaires', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, queued: !!res?.queued, error: !!res?.error }
  },

  async marquerPaye(id: string) {
    if (localDB) await localDB.salaires.update(id, { statut: 'paye', date_paiement: new Date().toISOString().slice(0, 10), mode_paiement: 'especes' })
    const res = await mutate({ endpoint: '/api/salaires', method: 'PUT', operation: 'UPDATE', payload: { id, marquerPaye: true, mode_paiement: 'especes' } })
    return { queued: !!res?.queued, error: !!res?.error }
  },

  async update(id: string, payload: { enseignant_nom?: string; matiere_principale?: string; salaire_net?: number }) {
    if (localDB) await localDB.salaires.update(id, payload)
    const res = await mutate({ endpoint: '/api/salaires', method: 'PUT', operation: 'UPDATE', payload: { id, ...payload } })
    return { queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Annonces
// ---------------------------------------------------------------------------

export const annonceRepo = {
  async create(payload: { titre: string; contenu: string; auteur_nom: string; priorite: 'normale' | 'importante' | 'urgente'; date_debut: string; date_fin?: string }) {
    const id = genererId()
    if (localDB) await localDB.annonces.put({ ...payload, id } as any)
    const res = await mutate({ endpoint: '/api/annonces', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, queued: !!res?.queued, error: !!res?.error }
  },
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const configRepo = {
  async save(payload: Record<string, string | number | undefined>) {
    if (localDB) {
      const entries = Object.entries(payload)
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) => ({ key, value: String(value) }))
      await localDB.config.bulkPut(entries)
    }
    const res = await mutate({ endpoint: '/api/config', method: 'PUT', operation: 'UPDATE', payload })
    return { queued: !!res?.queued, error: !!res?.error, status: res?.status }
  },
}

// ---------------------------------------------------------------------------
// Matières
// ---------------------------------------------------------------------------

export const matiereRepo = {
  async create(payload: { nom: string; code: string; coefficient: number }) {
    const id = genererId()
    if (localDB) await localDB.matieres.put({ ...payload, id } as any)
    const res = await mutate({ endpoint: '/api/matieres', method: 'POST', operation: 'INSERT', payload: { ...payload, id } })
    return { id, queued: !!res?.queued, error: !!res?.error }
  },

  async update(id: string, payload: { nom?: string; coefficient?: number }) {
    if (localDB) await localDB.matieres.update(id, payload)
    const res = await mutate({ endpoint: `/api/matieres/${id}`, method: 'PUT', operation: 'UPDATE', payload })
    return { queued: !!res?.queued, error: !!res?.error }
  },

  async remove(id: string) {
    if (localDB) await localDB.matieres.delete(id)
    const res = await mutate({ endpoint: `/api/matieres/${id}`, method: 'DELETE', operation: 'DELETE', payload: {} })
    return { queued: !!res?.queued, error: !!res?.error }
  },
}
