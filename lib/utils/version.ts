/**
 * Version utility for displaying app version information
 *
 * Reads version from package.json and provides consistent
 * version display throughout the application
 */

import packageJson from '../../package.json'

export const APP_VERSION = packageJson.version

/**
 * Get formatted version string for display
 */
export function getVersionString(): string {
  return `Version ${APP_VERSION}`
}

/**
 * Get just the version number
 */
export function getVersion(): string {
  return APP_VERSION
}
