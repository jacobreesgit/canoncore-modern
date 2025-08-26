import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth(req => {
  const { pathname } = req.nextUrl

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/universes']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If accessing a protected route without authentication, redirect to signin
  if (isProtectedRoute && !req.auth) {
    const signInUrl = new URL('/api/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (req.auth && pathname.startsWith('/api/auth/signin')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
