import { ZodError } from 'zod'
import type {
  AppError,
  FormErrors,
  ValidationError,
  ErrorReport,
  ErrorContext,
  ErrorSeverity,
} from './error-types'

// Re-export types for convenience
export type {
  FormErrors,
  AppError,
  ValidationError,
  ErrorReport,
  ErrorContext,
  ErrorSeverity,
}

/**
 * Checks if an error is a route error response (from React Router)
 */
export function isRouteErrorResponse(error: unknown): error is Response {
  return error instanceof Response
}

/**
 * Checks if an error is a Zod validation error
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

/**
 * Converts a Zod error to a user-friendly format
 */
export function formatZodError(error: ZodError): FormErrors {
  const flattened = error.flatten()

  return {
    formErrors: flattened.formErrors || [],
    fieldErrors: Object.fromEntries(
      Object.entries(flattened.fieldErrors || {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? value : [String(value)],
      ])
    ),
  }
}

/**
 * Converts field errors to validation error format
 */
export function formatFieldErrors(
  fieldErrors: Record<string, string[]>
): ValidationError[] {
  return Object.entries(fieldErrors).flatMap(([field, messages]) =>
    messages.map(message => ({
      field,
      message,
      code: 'VALIDATION_FAILED',
    }))
  )
}

/**
 * Creates a standardized app error
 */
export function createAppError(
  message: string,
  code?: string,
  statusCode?: number,
  context?: Record<string, unknown>
): AppError {
  return {
    message,
    code,
    statusCode,
    timestamp: new Date(),
    context,
  }
}

/**
 * Extracts error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  if (isZodError(error)) {
    const formatted = formatZodError(error)
    if (formatted.formErrors.length > 0) {
      return formatted.formErrors[0]
    }

    const firstFieldError = Object.values(formatted.fieldErrors)[0]?.[0]
    return firstFieldError || 'Validation failed'
  }

  return 'An unexpected error occurred'
}

/**
 * Determines error severity based on error type and context
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isRouteErrorResponse(error)) {
    if (error.status >= 500) return 'high'
    if (error.status >= 400) return 'medium'
    return 'low'
  }

  if (isZodError(error)) {
    return 'low'
  }

  if (error instanceof Error) {
    // Network errors are typically high severity
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'high'
    }
    return 'medium'
  }

  return 'medium'
}

/**
 * Creates error context from current environment
 */
export function createErrorContext(
  additionalContext?: Partial<ErrorContext>
): ErrorContext {
  return {
    timestamp: new Date(),
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    ...additionalContext,
  }
}

/**
 * Sanitizes error for production (removes sensitive information)
 */
export function sanitizeError(
  error: unknown,
  isProduction = process.env.NODE_ENV === 'production'
): unknown {
  if (!isProduction) {
    return error
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      // Don't include stack trace in production
    }
  }

  if (isRouteErrorResponse(error)) {
    return {
      status: error.status,
      statusText: error.statusText,
      // Don't include potentially sensitive data
    }
  }

  return error
}

/**
 * Creates an error report for monitoring/tracking
 */
export function createErrorReport(
  error: Error | AppError,
  context: Partial<ErrorContext> = {},
  severity?: ErrorSeverity
): ErrorReport {
  const fullContext = createErrorContext(context)

  return {
    error,
    context: fullContext,
    severity: severity || getErrorSeverity(error),
    tags: [],
  }
}
