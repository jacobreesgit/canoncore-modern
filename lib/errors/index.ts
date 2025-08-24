/**
 * Error handling exports
 */

// Components
export { ErrorBoundary } from './ErrorBoundary'

// Types
export type {
  AppError,
  ValidationError,
  FormErrors,
  ErrorContext,
  ErrorSeverity,
  ErrorReport,
  RouteErrorResponse,
  ErrorCode,
} from './error-types'

export { ErrorCodes } from './error-types'

// Utilities
export {
  isRouteErrorResponse,
  isZodError,
  formatZodError,
  formatFieldErrors,
  createAppError,
  getErrorMessage,
  getErrorSeverity,
  createErrorContext,
  sanitizeError,
  createErrorReport,
} from './error-utils'

// Messages
export {
  ERROR_MESSAGES,
  getErrorMessage as getErrorMessageByKey,
  formatErrorMessage,
  getHttpErrorMessage,
  HTTP_ERROR_MESSAGES,
} from './error-messages'
export type { ErrorMessageKey } from './error-messages'

// Tracking
export { errorTracker, ErrorTracker } from './error-tracking'
export type { ErrorTrackingConfig } from './error-tracking'
