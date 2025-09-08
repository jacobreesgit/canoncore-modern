import LanguageSwitcher from '@/components/language-switcher'

/**
 * Site Footer Component
 * Reusable footer with attribution and language switcher following Context7 accessibility best practices
 * Includes WCAG-compliant language selection for improved accessibility
 */
export function Footer() {
  return (
    <footer className="border-t bg-background w-full" role="contentinfo">
      <div className="w-full flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-8 py-2">
        {/* Attribution text */}
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © 2025 CanonCore. All rights reserved.
        </p>

        {/* Language switcher section */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm text-muted-foreground hidden sm:inline"
            id="language-selector-label"
          >
            Language:
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
