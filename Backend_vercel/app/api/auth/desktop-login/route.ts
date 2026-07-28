import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Connexion dédiée à l'application de bureau (Tauri). Contrairement au
 * navigateur, l'app de bureau ne peut pas s'appuyer sur les cookies de
 * session NextAuth (origine différente) — elle échange email/mot de passe
 * contre un jeton signé, stocké localement, envoyé ensuite en
 * "Authorization: Bearer" sur chaque appel à l'API. Voir lib/apiAuth.ts.
 * Les en-têtes CORS nécessaires sont ajoutés globalement par middleware.ts.
 */
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ? AND actif = 1 LIMIT 1',
    args: [email],
  })
  const user = result.rows[0]
  if (!user) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash as string)
  if (!valid) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const token = await new SignJWT({
    role: user.role,
    name: `${user.prenom} ${user.nom}`,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id as string)
    .setIssuedAt()
    // Session longue : c'est un poste fixe de l'école, pas un appareil
    // partagé — on évite de forcer une reconnexion fréquente.
    .setExpirationTime('180d')
    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET))

  return NextResponse.json({
    token,
    user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
  })
}
