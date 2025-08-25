/**
 * API Performance Benchmarks using Vitest
 *
 * Tests API endpoint performance under various load conditions.
 * Based on requirements from REBUILDING_CANONCORE.md section 9.4.
 */

import { bench, describe, beforeAll, afterAll } from 'vitest'
import { universeService } from '../../services/universe.service'
import { contentService } from '../../services/content.service'
import { userService } from '../../services/user.service'
import { progressService } from '../../services/progress.service'
import { relationshipService } from '../../services/relationship.service'

// Test data
let testUserId: string
let testUniverseId: string
const testContentIds: string[] = []

describe('API Performance Benchmarks', () => {
  beforeAll(async () => {
    console.log('🔧 Setting up API performance test data...')

    // Create test user
    const testUser = await userService.create({
      email: `api_perf_${Date.now()}@example.com`,
      passwordHash: 'test_hash',
      name: 'API Performance Test User',
    })
    testUserId = testUser.id

    // Create test universe
    const testUniverse = await universeService.create({
      name: 'API Performance Test Universe',
      description: 'Universe for API performance testing',
      isPublic: true,
      userId: testUserId,
    })
    testUniverseId = testUniverse.id

    // Create test content
    for (let i = 0; i < 50; i++) {
      const content = await contentService.create({
        name: `API Performance Content ${i}`,
        description: `Test content ${i} for API performance testing`,
        universeId: testUniverseId,
        userId: testUserId,
        isViewable: i % 4 !== 0,
        mediaType: (['video', 'text', 'audio', 'text'] as const)[i % 4],
      })
      testContentIds.push(content.id)
    }

    console.log(
      `✅ Created test data: user, universe, ${testContentIds.length} content items`
    )
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up API performance test data...')
    // Cleanup content first
    for (const contentId of testContentIds) {
      await contentService.delete(contentId)
    }
    // Finally user - this will cascade delete all remaining references
    await userService.deleteUser(testUserId)
  })

  describe('User Service Performance', () => {
    bench(
      'Get user by ID',
      async () => {
        await userService.getById(testUserId)
      },
      { iterations: 50 }
    )

    bench(
      'Update user profile',
      async () => {
        await userService.updateProfile(testUserId, {
          name: `Updated User ${Date.now()}`,
        })
      },
      { iterations: 20 }
    )

    bench(
      'Get user by ID (repeated)',
      async () => {
        await userService.getById(testUserId)
      },
      { iterations: 20 }
    )
  })

  describe('Universe Service Performance', () => {
    bench(
      'Get universe by ID',
      async () => {
        await universeService.getById(testUniverseId)
      },
      { iterations: 50 }
    )

    bench(
      'Get universe with content stats',
      async () => {
        await universeService.getWithContentStats(testUniverseId)
      },
      { iterations: 20 }
    )

    bench(
      'Get universe with user progress',
      async () => {
        await universeService.getByIdWithUserProgress(
          testUniverseId,
          testUserId
        )
      },
      { iterations: 15 }
    )

    bench(
      'Search public universes',
      async () => {
        await universeService.searchPublic('performance', 10)
      },
      { iterations: 30 }
    )
  })

  describe('Content Service Performance', () => {
    bench(
      'Get content by ID',
      async () => {
        const contentId =
          testContentIds[Math.floor(Math.random() * testContentIds.length)]
        await contentService.getById(contentId)
      },
      { iterations: 50 }
    )

    bench(
      'Get content by universe',
      async () => {
        await contentService.getByUniverse(testUniverseId)
      },
      { iterations: 20 }
    )

    bench(
      'Search content in universe',
      async () => {
        await contentService.searchInUniverse(testUniverseId, 'performance')
      },
      { iterations: 25 }
    )

    bench(
      'Get viewable content by universe',
      async () => {
        await contentService.getViewableByUniverse(testUniverseId)
      },
      { iterations: 30 }
    )
  })

  describe('Progress Service Performance', () => {
    bench(
      'Get user progress by universe',
      async () => {
        await progressService.getUserProgressByUniverse(
          testUserId,
          testUniverseId
        )
      },
      { iterations: 30 }
    )

    bench(
      'Set user progress',
      async () => {
        const contentId =
          testContentIds[Math.floor(Math.random() * testContentIds.length)]
        await progressService.setUserProgress(testUserId, {
          contentId,
          universeId: testUniverseId,
          progress: Math.random(),
        })
      },
      { iterations: 40 }
    )

    bench(
      'Calculate organisational progress',
      async () => {
        const contentItems = await contentService.getByUniverse(testUniverseId)
        if (contentItems.length > 0) {
          await progressService.calculateOrganisationalProgress(
            contentItems[0].id,
            testUserId,
            contentItems,
            []
          )
        }
      },
      { iterations: 15 }
    )

    bench(
      'Get progress summary',
      async () => {
        await progressService.getProgressSummary(testUserId)
      },
      { iterations: 20 }
    )
  })

  describe('Concurrent Operations', () => {
    bench(
      'Concurrent user lookups',
      async () => {
        const promises = Array.from({ length: 10 }, () =>
          userService.getById(testUserId)
        )
        await Promise.all(promises)
      },
      { iterations: 10 }
    )

    bench(
      'Concurrent content queries',
      async () => {
        const promises = testContentIds
          .slice(0, 10)
          .map(id => contentService.getById(id))
        await Promise.all(promises)
      },
      { iterations: 10 }
    )

    bench(
      'Concurrent progress updates',
      async () => {
        const promises = testContentIds.slice(0, 5).map(contentId =>
          progressService.setUserProgress(testUserId, {
            contentId,
            universeId: testUniverseId,
            progress: Math.random(),
          })
        )
        await Promise.all(promises)
      },
      { iterations: 8 }
    )
  })

  describe('Complex Service Operations', () => {
    bench(
      'Create universe with initial content',
      async () => {
        const universe = await universeService.create({
          name: `Benchmark Universe ${Date.now()}`,
          description: 'Created during benchmark',
          isPublic: false,
          userId: testUserId,
        })

        const content = await contentService.create({
          name: 'Initial Content',
          description: 'First content in benchmark universe',
          universeId: universe.id,
          userId: testUserId,
          isViewable: true,
          mediaType: 'article',
        })

        // Cleanup
        await contentService.delete(content.id)
        await universeService.delete(universe.id)
      },
      { iterations: 5 }
    )

    bench(
      'Build content hierarchy',
      async () => {
        // Create a small hierarchy for benchmarking
        const parentContent = testContentIds[0]
        const childContentIds = testContentIds.slice(1, 6)

        for (const childId of childContentIds) {
          await relationshipService.create(
            parentContent,
            childId,
            testUniverseId,
            testUserId
          )
        }

        // Get the content (simulating tree view)
        await contentService.getByUniverse(testUniverseId)

        // Cleanup relationships
        for (const childId of childContentIds) {
          await relationshipService.delete(parentContent, childId)
        }
      },
      { iterations: 3 }
    )
  })

  describe('Bulk Operations', () => {
    bench(
      'Bulk progress updates',
      async () => {
        const updates = testContentIds.slice(0, 20).map(contentId => ({
          userId: testUserId,
          contentId,
          progress: Math.random(),
        }))

        for (const update of updates) {
          await progressService.setUserProgress(update.userId, {
            contentId: update.contentId,
            universeId: testUniverseId,
            progress: update.progress,
          })
        }
      },
      { iterations: 3 }
    )

    bench(
      'Batch content creation',
      async () => {
        const contentPromises = Array.from({ length: 10 }, (_, i) =>
          contentService.create({
            name: `Batch Content ${i}_${Date.now()}`,
            description: `Batch created content ${i}`,
            universeId: testUniverseId,
            userId: testUserId,
            isViewable: true,
            mediaType: 'article',
          })
        )

        const createdContent = await Promise.all(contentPromises)

        // Cleanup
        for (const content of createdContent) {
          await contentService.delete(content.id)
        }
      },
      { iterations: 2 }
    )
  })
})
