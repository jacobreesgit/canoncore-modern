'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import type { Session } from 'next-auth'
import { StoreProvider } from './StoreProvider'

interface SessionProviderProps {
  children: ReactNode
  session?: Session | null
}

/**
 * NextAuth.js SessionProvider wrapper for client-side session access
 * Provides session data to all child components via React Context
 *
 * Usage: Wrap your app with this provider to enable useSession() hook
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      <StoreProvider>{children}</StoreProvider>
    </NextAuthSessionProvider>
  )
}
