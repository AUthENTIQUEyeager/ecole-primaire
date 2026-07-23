import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'fondateur'
  }
  interface Session {
    user: {
      id: string
      role: 'admin' | 'fondateur'
      name?: string | null
      email?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'fondateur'
    id: string
  }
}
