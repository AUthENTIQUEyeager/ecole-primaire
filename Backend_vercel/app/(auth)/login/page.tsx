'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { School, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setChargement(false)

    if (res?.error) {
      setErreur('Email ou mot de passe incorrect.')
      return
    }
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-card text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #ff6a3d)' }}
          >
            <School size={24} />
          </div>
          <h1 className="text-lg font-semibold text-text">Norio</h1>
          <p className="text-sm text-muted">Plateforme de gestion scolaire</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@etoiles-bobo.bf"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mot de passe</label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <button type="submit" disabled={chargement} className="btn-primary w-full justify-center">
            {chargement ? <Loader2 size={16} className="animate-spin" /> : null}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
