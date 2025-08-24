/**
 * Memory Performance Benchmarks using Vitest
 *
 * Tests memory usage patterns and detects potential leaks.
 * Based on requirements from REBUILDING_CANONCORE.md section 9.4.
 */

import { bench, describe, beforeAll, afterAll } from 'vitest'
import { db } from '../../db'
import { users, universes, content } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { universeService } from '../../services/universe.service'
import { contentService } from '../../services/content.service'

// Memory utilities
function getMemoryUsage() {
  if (global.gc) {
    global.gc()
  }
  return process.memoryUsage()
}

function formatBytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

let baselineMemory: NodeJS.MemoryUsage
let testUserId: string
let testUniverseId: string

describe('Memory Performance Benchmarks', () => {
  beforeAll(async () => {
    console.log('🔧 Setting up memory performance tests...')

    // Establish baseline memory
    if (global.gc) global.gc()
    baselineMemory = process.memoryUsage()

    console.log(`📊 Baseline memory usage:`)
    console.log(`   RSS: ${formatBytes(baselineMemory.rss)}`)
    console.log(`   Heap Used: ${formatBytes(baselineMemory.heapUsed)}`)
    console.log(`   Heap Total: ${formatBytes(baselineMemory.heapTotal)}`)

    // Create test user and universe
    const user = await db
      .insert(users)
      .values({
        id: `memory_test_user_${Date.now()}`,
        email: `memory_test@example.com`,
        passwordHash: 'test_hash',
        name: 'Memory Test User',
      })
      .returning()
    testUserId = user[0].id

    const universe = await db
      .insert(universes)
      .values({
        id: `memory_test_universe_${Date.now()}`,
        name: 'Memory Test Universe',
        description: 'Universe for memory testing',
        userId: testUserId,
        isPublic: true,
      })
      .returning()
    testUniverseId = universe[0].id
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up memory test data...')
    await db.delete(content).where(eq(content.universeId, testUniverseId))
    await db.delete(universes).where(eq(universes.id, testUniverseId))
    await db.delete(users).where(eq(users.id, testUserId))

    // Final memory check
    if (global.gc) global.gc()
    const finalMemory = process.memoryUsage()

    console.log(`📊 Final memory usage:`)
    console.log(
      `   RSS: ${formatBytes(finalMemory.rss)} (${formatBytes(finalMemory.rss - baselineMemory.rss)} change)`
    )
    console.log(
      `   Heap Used: ${formatBytes(finalMemory.heapUsed)} (${formatBytes(finalMemory.heapUsed - baselineMemory.heapUsed)} change)`
    )
  })

  describe('Memory Usage Under Load', () => {
    bench(
      'Large dataset query memory usage',
      async () => {
        const startMemory = getMemoryUsage()

        // Create 1000 content items
        const contentData = Array.from({ length: 1000 }, (_, i) => ({
          id: `memory_content_${i}_${Date.now()}`,
          name: `Memory Test Content ${i}`,
          description: `Memory test content item ${i}`.repeat(10), // Make description larger
          universeId: testUniverseId,
          userId: testUserId,
          isViewable: true,
          mediaType: 'article',
        }))

        await db.insert(content).values(contentData)

        // Query all content
        const allContent = await db
          .select()
          .from(content)
          .where(eq(content.universeId, testUniverseId))

        const endMemory = getMemoryUsage()
        const memoryDiff = endMemory.heapUsed - startMemory.heapUsed

        // Cleanup
        await db.delete(content).where(eq(content.universeId, testUniverseId))

        // Log memory usage for analysis
        console.log(
          `   Memory diff: ${formatBytes(memoryDiff)} for ${allContent.length} records`
        )
      },
      {
        iterations: 3,
        setup: () => {
          if (global.gc) global.gc()
        },
      }
    )

    bench(
      'Service layer memory usage',
      async () => {
        const startMemory = getMemoryUsage()

        // Create content through service layer
        const contentItems = []
        for (let i = 0; i < 500; i++) {
          const contentItem = await contentService.create({
            name: `Service Memory Test ${i}`,
            description:
              `Service created content for memory testing ${i}`.repeat(5),
            universeId: testUniverseId,
            userId: testUserId,
            isViewable: true,
            mediaType: 'article',
          })
          contentItems.push(contentItem)
        }

        // Get universe with content stats
        await universeService.getWithContentStats(testUniverseId)

        const endMemory = getMemoryUsage()
        const memoryDiff = endMemory.heapUsed - startMemory.heapUsed

        // Cleanup
        for (const item of contentItems) {
          await contentService.delete(item.id)
        }

        console.log(
          `   Service memory diff: ${formatBytes(memoryDiff)} for ${contentItems.length} operations`
        )
      },
      {
        iterations: 2,
        setup: () => {
          if (global.gc) global.gc()
        },
      }
    )
  })

  describe('Memory Leak Detection', () => {
    bench(
      'Repeated operations memory stability',
      async () => {
        const memoryReadings = []

        for (let cycle = 0; cycle < 10; cycle++) {
          // Create some content
          const contentItems = []
          for (let i = 0; i < 50; i++) {
            const item = await contentService.create({
              name: `Leak Test ${cycle}_${i}`,
              description: `Leak detection content`,
              universeId: testUniverseId,
              userId: testUserId,
              isViewable: true,
              mediaType: 'article',
            })
            contentItems.push(item)
          }

          // Query the content stats
          await universeService.getWithContentStats(testUniverseId)

          // Cleanup
          for (const item of contentItems) {
            await contentService.delete(item.id)
          }

          // Force GC and measure
          if (global.gc) global.gc()
          const currentMemory = process.memoryUsage()
          memoryReadings.push(currentMemory.heapUsed)
        }

        // Analyze memory trend
        const firstReading = memoryReadings[0]
        const lastReading = memoryReadings[memoryReadings.length - 1]
        const memoryGrowth = lastReading - firstReading

        console.log(
          `   Memory growth over 10 cycles: ${formatBytes(memoryGrowth)}`
        )

        // Log warning if significant growth
        if (memoryGrowth > 10 * 1024 * 1024) {
          // 10MB
          console.warn(
            `   ⚠️ Potential memory leak detected: ${formatBytes(memoryGrowth)} growth`
          )
        }
      },
      {
        iterations: 1, // Only run once to avoid test interference
        setup: () => {
          if (global.gc) global.gc()
        },
      }
    )
  })

  describe('Garbage Collection Effectiveness', () => {
    bench(
      'GC effectiveness test',
      async () => {
        const beforeGC = getMemoryUsage()

        // Create large objects
        const largeObjects = []
        for (let i = 0; i < 1000; i++) {
          largeObjects.push({
            id: i,
            data: new Array(1000).fill(`data_${i}`),
            content: `Large content string ${i}`.repeat(100),
          })
        }

        const afterAllocation = getMemoryUsage()
        const allocationDiff = afterAllocation.heapUsed - beforeGC.heapUsed

        // Clear references
        largeObjects.length = 0

        // Force garbage collection
        if (global.gc) {
          global.gc()
        }

        const afterGC = getMemoryUsage()
        const gcRecovered = afterAllocation.heapUsed - afterGC.heapUsed
        const gcEffectiveness = (gcRecovered / allocationDiff) * 100

        console.log(`   Allocated: ${formatBytes(allocationDiff)}`)
        console.log(`   Recovered: ${formatBytes(gcRecovered)}`)
        console.log(`   GC Effectiveness: ${gcEffectiveness.toFixed(2)}%`)
      },
      {
        iterations: 3,
        setup: () => {
          if (global.gc) global.gc()
        },
      }
    )
  })

  describe('Concurrent Operations Memory Impact', () => {
    bench(
      'Concurrent database operations',
      async () => {
        const startMemory = getMemoryUsage()

        // Simulate concurrent operations
        const promises = Array.from({ length: 20 }, async (_, i) => {
          // Each operation creates and cleans up content
          const contentItem = await contentService.create({
            name: `Concurrent ${i}`,
            description: `Concurrent operation content ${i}`,
            universeId: testUniverseId,
            userId: testUserId,
            isViewable: true,
            mediaType: 'article',
          })

          // Do some operations with the content
          await contentService.getById(contentItem.id)
          await contentService.update(contentItem.id, {
            name: `Updated Concurrent ${i}`,
          })

          // Cleanup
          await contentService.delete(contentItem.id)
        })

        await Promise.all(promises)

        const endMemory = getMemoryUsage()
        const memoryDiff = endMemory.heapUsed - startMemory.heapUsed

        console.log(
          `   Concurrent operations memory diff: ${formatBytes(memoryDiff)}`
        )
      },
      {
        iterations: 3,
        setup: () => {
          if (global.gc) global.gc()
        },
      }
    )
  })
})

// Note: global.gc is exposed via NODE_OPTIONS="--expose-gc"
