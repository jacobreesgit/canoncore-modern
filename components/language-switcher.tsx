'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { LanguageService } from '@/lib/services/language.service'
import { updateUserLanguagePreference } from '@/lib/actions/language-actions'

/**
 * LanguageSwitcher component
 * Allows users to switch between English UK and US variants
 * Follows accessibility best practices from Context7 research
 */
export default function LanguageSwitcher() {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()

  const supportedLanguages = LanguageService.getSupportedLanguages()

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return

    startTransition(async () => {
      // For authenticated users, save preference to database
      if (session?.user?.id) {
        try {
          await updateUserLanguagePreference(newLocale as 'en-GB' | 'en-US')
        } catch (error) {
          console.error('Failed to update language preference:', error)
          // Continue with navigation even if database update fails
        }
      }

      // Navigate to the same page with the new locale
      router.replace(pathname, { locale: newLocale as 'en-GB' | 'en-US' })
    })
  }

  return (
    <div
      className="relative"
      role="region"
      aria-labelledby="language-selector-label"
    >
      <label htmlFor="language-select" className="sr-only">
        {t('switchLanguage')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={e => handleLanguageChange(e.target.value)}
        disabled={isPending}
        className="appearance-none bg-background border border-border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 hover:bg-accent transition-colors"
        aria-label={`${t('currentLanguage')}: ${LanguageService.getLanguageDisplayName(locale)}`}
        aria-describedby={isPending ? 'language-loading' : undefined}
      >
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isPending && (
        <div
          className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md"
          id="language-loading"
          aria-live="polite"
        >
          <div
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
            aria-label="Loading language change"
          />
        </div>
      )}
    </div>
  )
}
