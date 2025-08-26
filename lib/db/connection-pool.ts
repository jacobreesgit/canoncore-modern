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

      // Track slow queries using error tracking system
      if (duration > 500) {
        import('@/lib/errors/error-tracking').then(({ errorTracker }) => {
          errorTracker.trackError(
            new Error(
              `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`
            ),
            {
              type: 'performance_warning',
              component: 'connection-pool',
              queryName,
              duration: duration.toFixed(2),
              threshold: 500,
            },
            'low'
          )
        })
      }
    }
  }) as T
}
