import { createClient } from '@libsql/client'

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: ReturnType<typeof createClient> | undefined
}

export const db =
  global.__tursoClient ??
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

if (process.env.NODE_ENV !== 'production') {
  global.__tursoClient = db
}
