import type { ErrorReport, ErrorContext, ErrorSeverity } from './error-types'
import {
  createErrorReport,
  createErrorContext,
  getErrorSeverity,
  sanitizeError,
} from './error-utils'

/**
 * Error tracking and monitoring service
 */

// Extend window interface for error tracking
declare global {
  interface Window {
    __errorTracker_userContext?: Record<string, unknown>
  }
}

interface ErrorTrackingConfig {
  enabled: boolean
  endpoint?: string
  apiKey?: string
  environment: 'development' | 'staging' | 'production'
  maxReportsPerSession: number
  rateLimitWindowMs: number
}

class ErrorTracker {
  private config: ErrorTrackingConfig
  private reportCount = 0
  private lastReportTime = 0
  private sessionId: string

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      environment:
        (process.env.NODE_ENV as 'development' | 'staging' | 'production') ||
        'development',
      maxReportsPerSession: 50,
      rateLimitWindowMs: 60000, // 1 minute
      ...config,
    }

    this.sessionId = this.generateSessionId()
  }

  /**
   * Track an error
   */
  async trackError(
    error: Error | unknown,
    context?: Partial<ErrorContext>,
    severity?: ErrorSeverity
  ): Promise<void> {
    if (!this.config.enabled) {
      if (this.config.environment === 'development') {
        console.error('Error tracked (dev):', error, context)
      }
      return
    }

    // Check rate limiting
    if (this.isRateLimited()) {
      // Log rate limiting in development, but don't create infinite loops
      if (this.config.environment === 'development') {
        console.warn('Error tracking rate limited')
      }
      return
    }

    try {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error))
      const fullContext = this.enrichContext(context)
      const errorSeverity = severity || getErrorSeverity(error)

      const report = createErrorReport(
        errorInstance,
        fullContext,
        errorSeverity
      )

      await this.sendReport(report)
      this.updateRateLimit()
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError)
    }
  }

  /**
   * Track validation errors
   */
  async trackValidationError(
    errors: Record<string, string[]>,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const errorMessage = `Validation failed: ${Object.keys(errors).join(', ')}`
    const validationError = new Error(errorMessage)
    validationError.name = 'ValidationError'

    await this.trackError(
      validationError,
      {
        ...context,
        validationErrors: errors,
      },
      'low'
    )
  }

  /**
   * Track route errors
   */
  async trackRouteError(
    route: string,
    error: unknown,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    await this.trackError(error, {
      ...context,
      route,
      type: 'route_error',
    })
  }

  /**
   * Track API errors
   */
  async trackAPIError(
    endpoint: string,
    method: string,
    status: number,
    error: unknown,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    await this.trackError(error, {
      ...context,
      endpoint,
      method,
      statusCode: status,
      type: 'api_error',
    })
  }

  /**
   * Track user action errors
   */
  async trackUserActionError(
    action: string,
    error: unknown,
    userId?: string,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    await this.trackError(error, {
      ...context,
      userId,
      action,
      type: 'user_action_error',
    })
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, additionalContext?: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      window.__errorTracker_userContext = {
        userId,
        ...additionalContext,
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (typeof window !== 'undefined') {
      delete window.__errorTracker_userContext
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, unknown> {
    if (typeof window === 'undefined' || !window.performance) {
      return {}
    }

    const navigation = window.performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming

    return {
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
      domContentLoaded:
        navigation?.domContentLoadedEventEnd -
        navigation?.domContentLoadedEventStart,
      firstPaint:
        window.performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: window.performance.getEntriesByName(
        'first-contentful-paint'
      )[0]?.startTime,
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private isRateLimited(): boolean {
    const now = Date.now()

    // Reset count if window has passed
    if (now - this.lastReportTime > this.config.rateLimitWindowMs) {
      this.reportCount = 0
    }

    return this.reportCount >= this.config.maxReportsPerSession
  }

  private updateRateLimit(): void {
    this.reportCount++
    this.lastReportTime = Date.now()
  }

  private enrichContext(context?: Partial<ErrorContext>): ErrorContext {
    const baseContext = createErrorContext(context)

    // Add user context if available
    const userContext =
      typeof window !== 'undefined'
        ? window.__errorTracker_userContext
        : undefined

    // Add performance metrics in browser
    const performanceMetrics = this.getPerformanceMetrics()

    return {
      ...baseContext,
      sessionId: this.sessionId,
      environment: this.config.environment,
      ...userContext,
      performance: performanceMetrics,
    }
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    const sanitizedReport: ErrorReport = {
      ...report,
      error: sanitizeError(report.error) as Error,
    }

    // In development, just log to console
    if (this.config.environment === 'development') {
      console.group('🐛 Error Report')
      console.error('Error:', sanitizedReport.error)
      console.log('Context:', sanitizedReport.context)
      console.log('Severity:', sanitizedReport.severity)
      console.groupEnd()
      return
    }

    // Send to external service if configured
    if (this.config.endpoint && this.config.apiKey) {
      try {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(sanitizedReport),
        })
      } catch (error) {
        console.error('Failed to send error report:', error)
      }
    }

    // Fallback: store in localStorage for later sending
    this.storeReportLocally(sanitizedReport)
  }

  private storeReportLocally(report: ErrorReport): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('error_reports') || '[]'
      const reports = JSON.parse(stored)

      reports.push(report)

      // Keep only the last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10)
      }

      localStorage.setItem('error_reports', JSON.stringify(reports))
    } catch (error) {
      // Only log localStorage failures in development to avoid infinite loops
      if (this.config.environment === 'development') {
        console.warn('Failed to store error report locally:', error)
      }
    }
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker({
  enabled: process.env.NODE_ENV === 'production',
  endpoint: process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_ERROR_TRACKING_API_KEY,
})

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled errors
  window.addEventListener('error', event => {
    errorTracker.trackError(event.error, {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    errorTracker.trackError(event.reason, {
      type: 'unhandled_promise_rejection',
    })
  })
}

// Export for use in components and services
export { ErrorTracker }
export type { ErrorTrackingConfig }
