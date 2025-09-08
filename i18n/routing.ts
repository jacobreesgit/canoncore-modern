import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // A list of all locales that are supported (English variants only)
  locales: ['en-GB', 'en-US'],

  // British English as default per requirements
  defaultLocale: 'en-GB',

  // Use custom URL prefixes for cleaner URLs
  localePrefix: {
    mode: 'always',
    prefixes: {
      'en-GB': '/uk',
      'en-US': '/us',
    },
  },

  // Configure locale cookie for user preferences
  // Following security best practices from Context7 research
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
})
