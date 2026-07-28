import { auth } from '@/lib/auth.edge'
import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // L'application de bureau (Tauri) appelle cette API depuis une autre
  // origine ("tauri://localhost" / "http://tauri.localhost" selon l'OS) —
  // sans ces en-têtes, ses requêtes sont bloquées silencieusement par le
  // navigateur embarqué (CORS). Traité ici, une fois pour toutes les routes,
  // plutôt que dans chaque fichier de route.
  if (pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
    }
    const res = NextResponse.next()
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v)
    return res
  }

  const session = req.auth

  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session?.user?.role === 'fondateur' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/fondateur', req.url))
  }
  if (session?.user?.role === 'admin' && pathname === '/fondateur') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
  if (session && pathname === '/login') {
    return NextResponse.redirect(
      new URL(session.user.role === 'admin' ? '/admin/dashboard' : '/fondateur', req.url)
    )
  }
})

export const config = {
  matcher: ['/((?!_next|icons|manifest.json|sw.js).*)'],
}
