/**
 * Error Types and Interfaces for CanonCore
 */

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  timestamp: Date
  context?: Record<string, unknown>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface FormErrors {
  formErrors: string[]
  fieldErrors: Record<string, string[]>
}

export interface ErrorContext {
  userId?: string
  route?: string
  userAgent?: string
  timestamp: Date
  sessionId?: string
  // Allow any additional context properties
  [key: string]: unknown
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorReport {
  error: Error | AppError
  context: ErrorContext
  severity: ErrorSeverity
  tags?: string[]
}

// Route Error Response Type (from React Router)
export interface RouteErrorResponse {
  status: number
  statusText: string
  data: unknown
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FORM_VALIDATION: 'FORM_VALIDATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
