'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { estConnecte } from '@/lib/apiConfig'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace(estConnecte() ? '/admin/dashboard' : '/login')
  }, [router])
  return null
}
