/**
 * Consistent error handling utilities for frontend and backend
 * Following Context7 best practices for unified error management
 */

import { z } from 'zod'
import type { User, Universe, Collection, Group, Content } from '@/lib/types'

// Specific data types that can be returned by services
export type ServiceData = 
  | User 
  | Universe 
  | Collection 
  | Group 
  | Content
  | User[]
  | Universe[]
  | Collection[]
  | Group[]
  | Content[]
  | { id: string; name: string; email: string }
  | { id: string; name: string; email: string; image: string | null }
  | void

// Standard error codes used throughout the application
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'USER_EXISTS' 
  | 'USER_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

// Consistent error response format
export interface ErrorResponse {
  error: string
  code: ErrorCode
  details?: Record<string, unknown>
}

// Consistent success response format with specific types
export interface SuccessResponse {
  success: true
  data: ServiceData
  message?: string
}

// Union type for service responses with specific types
export type ServiceResponse = SuccessResponse | ErrorResponse

/**
 * Create standardized error response
 */
export function createError(
  message: string, 
  code: ErrorCode, 
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error: message,
    code,
    ...(details && { details })
  }
}

/**
 * Create standardized success response
 */
export function createSuccess(
  data: ServiceData, 
  message?: string
): SuccessResponse {
  return {
    success: true,
    data,
    ...(message && { message })
  }
}

/**
 * Check if response is an error
 */
export function isError(response: ServiceResponse): response is ErrorResponse {
  return 'error' in response
}

/**
 * Check if response is successful
 */
export function isSuccess(response: ServiceResponse): response is SuccessResponse {
  return 'success' in response && response.success === true
}

/**
 * Map error codes to HTTP status codes
 * Used consistently across API routes
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  USER_EXISTS: 400,
  USER_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  DATABASE_ERROR: 500,
  NETWORK_ERROR: 503,
  UNKNOWN_ERROR: 500,
}

/**
 * Parse and standardize errors from various sources
 */
export function parseError(error: unknown): ErrorResponse {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    return createError(
      error.issues[0].message,
      'VALIDATION_ERROR',
      { zodErrors: error.issues }
    )
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Database constraint errors
    if (error.message.includes('unique constraint') || 
        error.message.includes('duplicate key')) {
      return createError(
        'Resource already exists',
        'USER_EXISTS'
      )
    }

    // Network errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('connection')) {
      return createError(
        'Network error occurred',
        'NETWORK_ERROR'
      )
    }

    return createError(error.message, 'UNKNOWN_ERROR')
  }

  // String errors
  if (typeof error === 'string') {
    return createError(error, 'UNKNOWN_ERROR')
  }

  // Unknown error types
  return createError('An unexpected error occurred', 'UNKNOWN_ERROR')
}

/**
 * Handle async operations with consistent error handling
 */
export async function handleAsync(
  operation: () => Promise<ServiceData>
): Promise<ServiceResponse> {
  try {
    const result = await operation()
    return createSuccess(result)
  } catch (error) {
    return parseError(error)
  }
}

/**
 * Frontend error display helper
 * Converts error codes to user-friendly messages
 */
export function getErrorMessage(error: ErrorResponse): string {
  const messageMap: Record<ErrorCode, string> = {
    VALIDATION_ERROR: error.error, // Use the specific validation message
    USER_EXISTS: 'An account with this email already exists',
    USER_NOT_FOUND: 'Account not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    DATABASE_ERROR: 'A server error occurred. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  }

  return messageMap[error.code] || error.error
}