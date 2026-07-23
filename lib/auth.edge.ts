import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

/**
 * Instance auth() dédiée au middleware (runtime Edge). Ne contient aucun
 * provider, donc ne charge ni bcryptjs ni le client Turso — elle se contente
 * de lire/vérifier le JWT de session déjà émis, ce qui est tout ce dont le
 * middleware a besoin pour protéger les routes.
 */
export const { auth } = NextAuth(authConfig)
