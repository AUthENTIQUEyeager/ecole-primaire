const CLE_URL = 'ecole_serveur_url'
const CLE_TOKEN = 'ecole_token'
const CLE_USER = 'ecole_user'

export interface UtilisateurLocal {
  id: string
  nom: string
  prenom: string
  email: string
  role: 'admin' | 'fondateur'
}

/** URL du serveur (déploiement Vercel), configurée une fois à l'écran de connexion. */
export function getServerUrl(): string {
  if (typeof window === 'undefined') return ''
  return (localStorage.getItem(CLE_URL) ?? '').replace(/\/+$/, '')
}

export function setServerUrl(url: string) {
  localStorage.setItem(CLE_URL, url.trim().replace(/\/+$/, ''))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CLE_TOKEN)
}

export function getUtilisateur(): UtilisateurLocal | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(CLE_USER)
  return raw ? JSON.parse(raw) : null
}

export function setSession(token: string, user: UtilisateurLocal) {
  localStorage.setItem(CLE_TOKEN, token)
  localStorage.setItem(CLE_USER, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(CLE_TOKEN)
  localStorage.removeItem(CLE_USER)
}

export function estConnecte(): boolean {
  return !!getToken() && !!getServerUrl()
}

/**
 * Équivalent de fetch(), mais vers le serveur distant configuré, avec le
 * jeton d'authentification joint automatiquement. Tous les appels réseau de
 * l'app de bureau (repo.ts, pull.ts, syncManager.ts) passent par ici — c'est
 * le seul endroit qui connaît l'URL du serveur et le jeton.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getServerUrl()
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${base}${path}`, { ...options, headers })
}
