import type { NextAuthConfig } from 'next-auth'

/**
 * Configuration compatible Edge Runtime : uniquement les callbacks de session
 * et les pages. AUCUN provider ici — le Credentials provider a besoin de
 * bcryptjs et de la connexion Turso, deux choses qui ne doivent PAS être
 * chargées dans le middleware (runtime Edge, très restreint). Le middleware
 * importe cette config seule ; les routes API importent la config complète
 * (voir lib/auth.ts) qui étend celle-ci avec les providers.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  providers: [], // renseignés uniquement dans lib/auth.ts (runtime Node.js)
} satisfies NextAuthConfig
