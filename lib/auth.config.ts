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
  // Déduit l'URL depuis les en-têtes de la requête (host/proto) plutôt que de
  // dépendre de NEXTAUTH_URL/AUTH_URL — évite le bug où une valeur oubliée à
  // "http://localhost:3000" dans les variables d'environnement Vercel fait
  // rediriger la prod vers localhost après connexion.
  trustHost: true,
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
