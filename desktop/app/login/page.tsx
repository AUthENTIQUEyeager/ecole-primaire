'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, School } from 'lucide-react'
import { getServerUrl, setServerUrl, setSession, estConnecte } from '@/lib/apiConfig'

export default function LoginPage() {
  const router = useRouter()
  const [serveur, setServeur] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (estConnecte()) router.replace('/admin/dashboard')
    setServeur(getServerUrl())
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)

    let url: string
    try {
      url = new URL(serveur.trim()).origin
    } catch {
      setErreur("L'adresse du serveur n'est pas valide (ex : https://mon-ecole.vercel.app)")
      return
    }

    setChargement(true)
    try {
      const res = await fetch(`${url}/api/auth/desktop-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: motDePasse }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErreur(data?.error ?? 'Connexion refusée. Vérifiez vos identifiants.')
        setChargement(false)
        return
      }

      setServerUrl(url)
      setSession(data.token, data.user)
      router.replace(data.user.role === 'admin' ? '/admin/dashboard' : '/login')
    } catch {
      setErreur(
        "Impossible de joindre le serveur. Vérifiez votre connexion et l'adresse saisie — une connexion est nécessaire uniquement pour cette première connexion."
      )
      setChargement(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[420px] rounded-modal bg-surface p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-primary">
            <School size={22} />
          </div>
          <h1 className="text-lg font-semibold text-text">École Primaire Privée Les Étoiles</h1>
          <p className="text-sm text-muted">Connexion à l'application de bureau</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Adresse du serveur</label>
            <input
              className="input-field"
              placeholder="https://mon-ecole.vercel.app"
              value={serveur}
              onChange={(e) => setServeur(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              L'adresse de votre site (celle donnée par Vercel). À saisir une seule fois.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mot de passe</label>
            <input
              type="password"
              className="input-field"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <button type="submit" disabled={chargement} className="btn-primary w-full justify-center">
            {chargement ? <Loader2 size={16} className="animate-spin" /> : null}
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Une connexion internet est nécessaire uniquement pour cette première connexion — ensuite,
          l'application fonctionne sans connexion et se synchronise automatiquement dès qu'elle revient.
        </p>
      </div>
    </div>
  )
}
