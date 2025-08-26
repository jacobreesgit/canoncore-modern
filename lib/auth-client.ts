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
