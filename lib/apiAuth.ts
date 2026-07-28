import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

function secret() {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
}

export interface Identity {
  user: { id: string; role: 'admin' | 'fondateur'; name?: string; email?: string }
}

/**
 * Authentifie une requête API : accepte soit la session NextAuth habituelle
 * (cookie — utilisée par le navigateur, ex. tableau de bord fondatrice), soit
 * un jeton "Authorization: Bearer" (utilisé par l'application de bureau de
 * l'école — elle n'a pas de cookies de session partagés avec ce domaine).
 *
 * Retourne un objet à la même forme que la session NextAuth (`{ user: {...} }`)
 * pour que les routes existantes n'aient qu'à remplacer `await auth()` par
 * `await getIdentity(req)`, sans toucher au reste de leur logique.
 */
export async function getIdentity(req: NextRequest): Promise<Identity | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const { payload } = await jwtVerify(token, secret())
      return {
        user: {
          id: payload.sub as string,
          role: payload.role as 'admin' | 'fondateur',
          name: payload.name as string | undefined,
          email: payload.email as string | undefined,
        },
      }
    } catch {
      return null
    }
  }
  return (await auth()) as Identity | null
}
