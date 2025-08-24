/**
 * Performance Testing Configuration
 *
 * Centralized configuration for all performance testing tools and benchmarks.
 * Based on the requirements from REBUILDING_CANONCORE.md section 9.4.
 */

export interface PerformanceConfig {
  database: DatabasePerformanceConfig
  api: ApiPerformanceConfig
  lighthouse: LighthouseConfig
  loadTesting: LoadTestingConfig
  memory: MemoryConfig
  thresholds: PerformanceThresholds
}

export interface DatabasePerformanceConfig {
  /** Test dataset sizes for performance benchmarking */
  datasetSizes: number[]
  /** Query timeout in milliseconds */
  queryTimeout: number
  /** Connection pool size for stress testing */
  connectionPoolSize: number
  /** Maximum hierarchy depth for tree testing */
  maxHierarchyDepth: number
}

export interface ApiPerformanceConfig {
  /** Target response times in milliseconds */
  responseTimeThresholds: {
    simple: number
    complex: number
    database: number
  }
  /** Concurrent user limits for testing */
  concurrentUsers: {
    low: number
    medium: number
    high: number
    stress: number
  }
  /** Request timeout in milliseconds */
  requestTimeout: number
}

export interface LighthouseConfig {
  /** Target scores for Lighthouse audits */
  targetScores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
    pwa: number
  }
  /** Pages to audit */
  pages: string[]
  /** Device settings for testing */
  devices: Array<'desktop' | 'mobile'>
}

export interface LoadTestingConfig {
  /** Load test phases */
  phases: Array<{
    duration: number // seconds
    arrivalRate: number // requests per second
  }>
  /** Virtual user scenarios */
  scenarios: string[]
  /** Target response time percentiles */
  responseTimePercentiles: {
    p50: number
    p95: number
    p99: number
  }
}

export interface MemoryConfig {
  /** Memory usage thresholds in MB */
  thresholds: {
    warning: number
    critical: number
  }
  /** Memory sampling interval in milliseconds */
  samplingInterval: number
  /** Garbage collection monitoring */
  gcMonitoring: boolean
}

export interface PerformanceThresholds {
  /** Database query performance targets */
  database: {
    averageResponseTime: number // ms
    p95ResponseTime: number // ms
    queriesPerSecond: number
  }
  /** Page load performance targets */
  pageLoad: {
    initialLoad: number // ms
    largestContentfulPaint: number // ms
    timeToFirstByte: number // ms
  }
  /** Memory usage targets */
  memory: {
    peakUsagePerUser: number // MB
    memoryLeakThreshold: number // MB over time
  }
  /** Bundle size targets */
  bundle: {
    initialJavaScript: number // KB
    lazyChunks: number // KB
  }
}

/**
 * Default performance testing configuration
 * Based on requirements from REBUILDING_CANONCORE.md section 9.4
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  database: {
    datasetSizes: [100, 1000, 10000, 100000],
    queryTimeout: 5000, // 5 seconds
    connectionPoolSize: 20,
    maxHierarchyDepth: 20,
  },
  api: {
    responseTimeThresholds: {
      simple: 100, // Simple queries <100ms
      complex: 500, // Complex operations <500ms
      database: 100, // Database queries <100ms average
    },
    concurrentUsers: {
      low: 10,
      medium: 50,
      high: 100,
      stress: 200,
    },
    requestTimeout: 10000, // 10 seconds
  },
  lighthouse: {
    targetScores: {
      performance: 90,
      accessibility: 90,
      bestPractices: 90,
      seo: 90,
      pwa: 80, // Lower threshold for PWA as it's not primary focus
    },
    pages: ['/', '/discover', '/dashboard', '/register', '/universes/create'],
    devices: ['desktop', 'mobile'],
  },
  loadTesting: {
    phases: [
      { duration: 60, arrivalRate: 10 }, // Warm-up phase
      { duration: 120, arrivalRate: 50 }, // Steady load
      { duration: 60, arrivalRate: 100 }, // High load
      { duration: 30, arrivalRate: 200 }, // Stress test
    ],
    scenarios: [
      'user-registration',
      'universe-creation',
      'content-navigation',
      'progress-tracking',
      'favorites-management',
    ],
    responseTimePercentiles: {
      p50: 500, // 50th percentile <500ms
      p95: 2000, // 95th percentile <2s
      p99: 5000, // 99th percentile <5s
    },
  },
  memory: {
    thresholds: {
      warning: 50, // 50MB per user session
      critical: 100, // 100MB critical threshold
    },
    samplingInterval: 1000, // 1 second
    gcMonitoring: true,
  },
  thresholds: {
    database: {
      averageResponseTime: 100,
      p95ResponseTime: 200,
      queriesPerSecond: 1000,
    },
    pageLoad: {
      initialLoad: 2000, // <2s initial load target
      largestContentfulPaint: 2500,
      timeToFirstByte: 600,
    },
    memory: {
      peakUsagePerUser: 50,
      memoryLeakThreshold: 10, // 10MB growth over 10 minutes
    },
    bundle: {
      initialJavaScript: 500, // 500KB initial bundle
      lazyChunks: 200, // 200KB per lazy chunk
    },
  },
}

/**
 * Environment-specific configuration overrides
 */
export function getPerformanceConfig(
  env: 'development' | 'staging' | 'production'
): PerformanceConfig {
  const baseConfig = { ...defaultPerformanceConfig }

  switch (env) {
    case 'development':
      // More lenient thresholds for development
      return {
        ...baseConfig,
        thresholds: {
          ...baseConfig.thresholds,
          database: {
            ...baseConfig.thresholds.database,
            averageResponseTime: 200, // Allow slower queries in dev
          },
          pageLoad: {
            ...baseConfig.thresholds.pageLoad,
            initialLoad: 3000, // Allow slower page loads in dev
          },
        },
      }

    case 'staging':
      // Production-like thresholds but slightly more lenient
      return {
        ...baseConfig,
        thresholds: {
          ...baseConfig.thresholds,
          database: {
            ...baseConfig.thresholds.database,
            averageResponseTime: 150,
          },
        },
      }

    case 'production':
    default:
      return baseConfig
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`
    }
    return `${(milliseconds / 1000).toFixed(2)}s`
  }

  static formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)}MB`
  }

  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  static generateTestData(size: number) {
    return {
      users: Array.from({ length: Math.ceil(size / 10) }, (_, i) => ({
        id: `test-user-${i}`,
        email: `user${i}@test.com`,
        displayName: `Test User ${i}`,
      })),
      universes: Array.from({ length: size }, (_, i) => ({
        id: `test-universe-${i}`,
        name: `Test Universe ${i}`,
        description: `Description for test universe ${i}`,
        isPublic: i % 3 === 0, // Every 3rd universe is public
      })),
      content: Array.from({ length: size * 5 }, (_, i) => ({
        id: `test-content-${i}`,
        title: `Test Content ${i}`,
        contentType: ['movie', 'episode', 'book', 'audio'][i % 4],
        isViewable: i % 2 === 0,
      })),
    }
  }
}
