import 'server-only'

/**
 * Database Connection Pool Optimization
 *
 * This module provides connection pooling optimizations for the Neon serverless database.
 * It includes connection reuse strategies, query performance monitoring, and connection health checks.
 */

interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  success: boolean
}

class DatabasePerformanceMonitor {
  private static metrics: QueryMetrics[] = []
  private static readonly MAX_METRICS = 1000

  static recordQuery(query: string, duration: number, success: boolean) {
    this.metrics.push({
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: new Date(),
      success,
    })

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  static getMetrics() {
    return this.metrics
  }

  static getSlowQueries(thresholdMs: number = 1000) {
    return this.metrics.filter(m => m.duration > thresholdMs)
  }

  static getAverageQueryTime() {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / this.metrics.length
  }

  static getFailureRate() {
    if (this.metrics.length === 0) return 0
    const failures = this.metrics.filter(m => !m.success).length
    return failures / this.metrics.length
  }
}

/**
 * Performance monitoring wrapper for database queries
 */

export function withPerformanceMonitoring<
  T extends (...args: never[]) => Promise<unknown>,
>(queryFn: T, queryName: string): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now()
    let success = false

    try {
      const result = await queryFn(...args)
      success = true
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - start
      DatabasePerformanceMonitor.recordQuery(queryName, duration, success)

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

/**
 * Connection health monitoring
 */
export class ConnectionHealthMonitor {
  private static lastHealthCheck = 0
  private static readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  static async checkHealth() {
    const now = Date.now()
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return true
    }

    try {
      const { db } = await import('@/lib/db')
      const start = performance.now()

      // Simple health check query
      const { sql } = await import('drizzle-orm')
      await db.execute(sql`SELECT 1`)

      const duration = performance.now() - start
      this.lastHealthCheck = now

      // Log connection health in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Database health check: ${duration.toFixed(2)}ms`)
      }

      return duration < 5000 // Consider healthy if response time < 5s
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

/**
 * Connection optimization utilities
 */
export class ConnectionOptimizer {
  private static connectionCache = new Map<
    string,
    { connection: unknown; timestamp: number }
  >()
  private static readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  /**
   * Cache database connections for reuse in serverless environments
   */
  static getCachedConnection(key: string) {
    const cached = this.connectionCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.connection
    }
    return null
  }

  static setCachedConnection(key: string, connection: unknown) {
    this.connectionCache.set(key, {
      connection,
      timestamp: Date.now(),
    })
  }

  /**
   * Clean up expired connections
   */
  static cleanupConnections() {
    const now = Date.now()
    for (const [key, cached] of this.connectionCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.connectionCache.delete(key)
      }
    }
  }
}

/**
 * Query optimization recommendations
 */
export function getPerformanceRecommendations() {
  const slowQueries = DatabasePerformanceMonitor.getSlowQueries()
  const avgTime = DatabasePerformanceMonitor.getAverageQueryTime()
  const failureRate = DatabasePerformanceMonitor.getFailureRate()

  const recommendations: string[] = []

  if (slowQueries.length > 0) {
    recommendations.push(
      `Found ${slowQueries.length} slow queries. Consider adding indexes or optimizing these queries.`
    )
  }

  if (avgTime > 500) {
    recommendations.push(
      `Average query time is ${avgTime.toFixed(2)}ms. Consider using prepared statements or query optimization.`
    )
  }

  if (failureRate > 0.05) {
    recommendations.push(
      `Query failure rate is ${(failureRate * 100).toFixed(2)}%. Check error handling and connection stability.`
    )
  }

  if (recommendations.length === 0) {
    recommendations.push('Database performance looks good!')
  }

  return recommendations
}

// Export the performance monitor for use in other modules
export { DatabasePerformanceMonitor }
