import { auth } from '@/lib/auth.edge'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
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
  matcher: ['/((?!api|_next|icons|manifest.json|sw.js).*)'],
}
