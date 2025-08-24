/**
 * Centralized error messages for consistent UX
 */

export const ERROR_MESSAGES = {
  // General errors
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR:
    'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PERMISSION_DENIED: "You don't have permission to perform this action.",

  // Authentication errors
  LOGIN_REQUIRED: 'You must be logged in to access this page.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',

  // Universe-specific errors
  UNIVERSE_NOT_FOUND: 'Universe not found.',
  UNIVERSE_ACCESS_DENIED: "You don't have access to this universe.",
  UNIVERSE_NAME_REQUIRED: 'Universe name is required.',
  UNIVERSE_NAME_TOO_LONG: 'Universe name must be 255 characters or less.',

  // Content-specific errors
  CONTENT_NOT_FOUND: 'Content not found.',
  CONTENT_ACCESS_DENIED: "You don't have access to this content.",
  CONTENT_NAME_REQUIRED: 'Content name is required.',

  // User-specific errors
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  USERNAME_TAKEN: 'This username is already taken.',

  // File/Upload errors
  FILE_TOO_LARGE: 'File size is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',

  // Database errors
  DATABASE_CONNECTION_ERROR:
    'Database connection error. Please try again later.',
  DATA_INTEGRITY_ERROR: 'Data integrity error. Please check your input.',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES

/**
 * Get error message by key with fallback
 */
export function getErrorMessage(
  key: ErrorMessageKey,
  fallback?: string
): string {
  return ERROR_MESSAGES[key] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Format error message with dynamic values
 */
export function formatErrorMessage(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (message, [key, value]) =>
      message.replace(new RegExp(`{${key}}`, 'g'), String(value)),
    template
  )
}

/**
 * HTTP status code to user-friendly message mapping
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input.',
  401: ERROR_MESSAGES.LOGIN_REQUIRED,
  403: ERROR_MESSAGES.PERMISSION_DENIED,
  404: 'The requested resource was not found.',
  409: 'Conflict. The resource already exists.',
  422: 'Invalid input. Please check your data.',
  429: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  500: ERROR_MESSAGES.SERVER_ERROR,
  502: 'Service temporarily unavailable.',
  503: 'Service temporarily unavailable.',
  504: 'Request timeout. Please try again.',
}

/**
 * Get user-friendly message for HTTP status code
 */
export function getHttpErrorMessage(statusCode: number): string {
  return HTTP_ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.UNKNOWN_ERROR
}
