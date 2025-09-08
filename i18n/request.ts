import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import deepmerge from 'deepmerge'
import { routing } from './routing'
import { auth } from '@/auth'
import { UserService } from '@/lib/services/user.service'

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale from the URL
  const requested = await requestLocale
  let locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  // Check if user is authenticated and has a language preference
  try {
    const session = await auth()
    if (session?.user?.id) {
      const userResult = await UserService.findById(session.user.id)
      if (userResult.success && userResult.data.preferredLanguage) {
        // Use user's preferred language if it's valid
        if (hasLocale(routing.locales, userResult.data.preferredLanguage)) {
          locale = userResult.data.preferredLanguage
        }
      }
    }
  } catch (error) {
    // Fall back to URL-based or default locale if user preference check fails
    console.warn('Failed to get user language preference:', error)
  }

  // Load messages with fallback strategy
  let messages

  if (locale === 'en-US') {
    // Load British base + American overrides for efficiency
    const baseMessages = (await import(`../messages/en-GB.json`)).default
    const overrideMessages = (await import(`../messages/en-US.json`)).default
    messages = deepmerge(baseMessages, overrideMessages)
  } else {
    // Load complete British English messages (default)
    messages = (await import(`../messages/en-GB.json`)).default
  }

  return {
    locale,
    messages,
    // Set consistent timezone (can be overridden per user later)
    timeZone: 'Europe/London',
    // Opt-in to consistent time reference for testing
    now: new Date(),
  }
})
