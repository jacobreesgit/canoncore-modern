import { type SupportedLocale } from '@/lib/validations'

export interface LanguageInfo {
  code: SupportedLocale
  name: string
  flag: string
  displayName: string
}

/**
 * LanguageService - Handles language-related operations and metadata
 * Following best practices for i18n language management
 */
export class LanguageService {
  /**
   * Get all supported languages with metadata
   * Currently supporting English variants only
   * Used by language switcher and user preferences
   */
  static getSupportedLanguages(): LanguageInfo[] {
    return [
      {
        code: 'en-GB',
        name: 'English (UK)',
        flag: '🇬🇧',
        displayName: 'English (United Kingdom)',
      },
      {
        code: 'en-US',
        name: 'English (US)',
        flag: '🇺🇸',
        displayName: 'English (United States)',
      },
    ]
  }

  /**
   * Get language display name by code
   * Used for displaying language names in UI
   */
  static getLanguageDisplayName(code: string): string {
    const language = this.getSupportedLanguages().find(
      lang => lang.code === code
    )
    return language?.name || code
  }
}