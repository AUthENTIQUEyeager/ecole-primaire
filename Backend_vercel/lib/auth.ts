import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { authConfig } from './auth.config'

// Config complète (providers + accès DB) — utilisée uniquement dans les
// routes API et Server Components, qui tournent sur le runtime Node.js.
// Ne JAMAIS importer ce fichier depuis middleware.ts (voir lib/auth.edge.ts).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const result = await db.execute({
          sql: 'SELECT * FROM users WHERE email = ? AND actif = 1 LIMIT 1',
          args: [email],
        })
        const user = result.rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password_hash as string)
        if (!valid) return null

        return {
          id: user.id as string,
          name: `${user.prenom} ${user.nom}`,
          email: user.email as string,
          role: user.role as 'admin' | 'fondateur',
        }
      },
    }),
  ],
})
