import { auth } from './auth'
import { redirect } from 'next/navigation'

/**
 * Server-side function to get the current session
 * Use this in Server Components and Server Actions
 */
export async function getCurrentSession() {
  return await auth()
}

/**
 * Server-side function to get the current user
 * Returns the user object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}

/**
 * Server-side function to require authentication
 * Redirects to signin page if user is not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return session
}

/**
 * Server-side function to get authenticated user or redirect
 * Returns the user object, guaranteed to be non-null
 */
export async function getAuthenticatedUser() {
  const session = await requireAuth()
  return session.user
}
