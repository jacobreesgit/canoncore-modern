/**
 * Client-side authentication utilities for NextAuth.js v5
 *
 * This module provides convenient hooks and utilities for client components
 * to interact with NextAuth.js session management.
 */

'use client'

import { useSession, signIn, signOut, getSession } from 'next-auth/react'

// Re-export commonly used NextAuth.js client functions
export { useSession, signIn, signOut, getSession }

// Export session status types for TypeScript
export type { Session } from 'next-auth'

/**
 * Custom hook for getting user information from session
 * Returns null if user is not authenticated
 */
export function useUser() {
  const { data: session } = useSession()
  return session?.user ?? null
}

/**
 * Custom hook for checking if user is authenticated
 * Returns boolean indicating authentication status
 */
export function useIsAuthenticated() {
  const { status } = useSession()
  return status === 'authenticated'
}

/**
 * Custom hook for checking if session is loading
 * Useful for showing loading states
 */
export function useIsLoading() {
  const { status } = useSession()
  return status === 'loading'
}
