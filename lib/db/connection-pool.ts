import 'server-only'

/**
 * Database Performance Monitoring
 *
 * This module provides basic query performance monitoring for the Neon serverless database.
 */

/**
 * Performance monitoring wrapper for database queries
 */

export function withPerformanceMonitoring<
  T extends (...args: never[]) => Promise<unknown>,
>(queryFn: T, queryName: string): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now()

    try {
      const result = await queryFn(...args)
      return result
    } catch (error) {
      throw error
    } finally {
      const duration = performance.now() - start

      // Log slow queries in development
      if (duration > 500 && process.env.NODE_ENV === 'development') {
        console.warn(
          `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`
        )
      }
    }
  }) as T
}
