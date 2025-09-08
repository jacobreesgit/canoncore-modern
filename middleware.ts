import { auth } from '@/auth'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import type { NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

const publicPages = ['/', '/uk', '/us']

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap(p => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  if (isPublicPage) {
    return handleI18nRouting(req)
  } else {
    // For protected routes, use NextAuth middleware then i18n routing
    const authMiddleware = auth as unknown as (
      handler?: (req: NextRequest) => void | Response | Promise<Response>
    ) => (req: NextRequest) => void | Response | Promise<Response>
    return authMiddleware((req: NextRequest) => {
      return handleI18nRouting(req)
    })(req)
  }
}

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Next.js internals (/_next/*)
  // - Vercel internals (/_vercel/*)
  // - Static files containing dots
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
