/**
 * Database Performance Benchmarks using Vitest
 *
 * Tests database query performance across different dataset sizes and complexity levels.
 * Based on requirements from REBUILDING_CANONCORE.md section 9.4.
 */

import { bench, describe, beforeAll, afterAll } from 'vitest'
import { db } from '../../db'
import {
  users,
  universes,
  content,
  contentRelationships,
  userProgress,
  favorites,
} from '../../db/schema'
import { sql, eq, count, avg } from 'drizzle-orm'
import { universeService } from '../../services/universe.service'

interface TestData {
  users: { id: string; email: string; passwordHash: string; name: string }[]
  universes: {
    id: string
    name: string
    description: string
    userId: string
    isPublic: boolean
  }[]
  content: {
    id: string
    name: string
    description: string
    universeId: string
    userId: string
    isViewable: boolean
    mediaType: string
  }[]
  relationships: {
    id: string
    parentId: string
    childId: string
    universeId: string
    userId: string
    displayOrder: number
  }[]
  progress: {
    id: string
    userId: string
    contentId: string
    universeId: string
    progress: number
  }[]
  favorites: {
    id: string
    userId: string
    targetId: string
    targetType: string
  }[]
}

// Test data sizes to benchmark against
const TEST_SIZES = [100, 1000, 10000] // Reduced from original for faster CI

let testData: TestData
let testUserIds: string[] = []

describe('Database Performance Benchmarks', () => {
  beforeAll(async () => {
    console.log('🔧 Setting up database performance test data...')

    // Clean up any existing test data
    await cleanupTestData()

    // Generate test data for largest size (will use subsets for smaller tests)
    testData = await generateTestData(Math.max(...TEST_SIZES))

    console.log(`✅ Generated test data:`)
    console.log(`   Users: ${testData.users.length}`)
    console.log(`   Universes: ${testData.universes.length}`)
    console.log(`   Content: ${testData.content.length}`)
    console.log(`   Relationships: ${testData.relationships.length}`)
    console.log(`   Progress: ${testData.progress.length}`)
    console.log(`   Favorites: ${testData.favorites.length}`)
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up database performance test data...')
    await cleanupTestData()
  })

  describe('Basic CRUD Operations', () => {
    TEST_SIZES.forEach(size => {
      bench(
        `User creation - ${size} records`,
        async () => {
          const userData = testData.users.slice(0, size).map(user => ({
            ...user,
            id: `bench_${user.id}_${Date.now()}_${Math.random()}`,
            email: `bench_${Date.now()}_${Math.random()}@example.com`,
          }))

          await db.insert(users).values(userData)

          // Track created IDs for cleanup
          testUserIds.push(...userData.map(u => u.id))
        },
        { iterations: 3 }
      )

      bench(
        `Universe queries - ${size} records`,
        async () => {
          const universeData = testData.universes.slice(0, size)

          for (const universe of universeData.slice(0, 10)) {
            // Sample 10 for performance
            await db
              .select()
              .from(universes)
              .where(eq(universes.id, universe.id))
          }
        },
        { iterations: 5 }
      )

      bench(
        `Content search - ${size} records`,
        async () => {
          const searchTerms = ['test', 'content', 'example', 'sample']

          for (const term of searchTerms) {
            await db
              .select()
              .from(content)
              .where(sql`${content.name} ILIKE ${'%' + term + '%'}`)
              .limit(20)
          }
        },
        { iterations: 3 }
      )
    })
  })

  describe('Complex Query Performance', () => {
    TEST_SIZES.forEach(size => {
      bench(
        `Universe with content aggregation - ${size} records`,
        async () => {
          const universeData = testData.universes.slice(
            0,
            Math.min(size / 10, 100)
          )

          for (const universe of universeData.slice(0, 5)) {
            // Sample 5 universes
            await db
              .select({
                universeId: universes.id,
                universeName: universes.name,
                contentCount: count(content.id),
                avgProgress: avg(userProgress.progress),
              })
              .from(universes)
              .leftJoin(content, eq(content.universeId, universes.id))
              .leftJoin(userProgress, eq(userProgress.universeId, universes.id))
              .where(eq(universes.id, universe.id))
              .groupBy(universes.id, universes.name)
          }
        },
        { iterations: 3 }
      )

      bench(
        `Content hierarchy traversal - ${size} records`,
        async () => {
          const contentData = testData.content.slice(0, Math.min(size / 5, 200))

          for (const contentItem of contentData.slice(0, 5)) {
            // Sample 5 content items
            // Get all children recursively
            await db.execute(sql`
            WITH RECURSIVE content_hierarchy AS (
              SELECT id, name, universe_id, 0 as depth
              FROM content
              WHERE id = ${contentItem.id}
              
              UNION ALL
              
              SELECT c.id, c.name, c.universe_id, ch.depth + 1
              FROM content c
              JOIN content_relationships cr ON c.id = cr.child_id
              JOIN content_hierarchy ch ON cr.parent_id = ch.id
              WHERE ch.depth < 10
            )
            SELECT * FROM content_hierarchy
          `)
          }
        },
        { iterations: 2 }
      )
    })
  })

  describe('Service Layer Performance', () => {
    bench(
      'Universe service - get universe with progress',
      async () => {
        const testUniverse = testData.universes[0]
        const testUser = testData.users[0]

        if (testUniverse && testUser) {
          await universeService.calculateUniverseProgress(
            testUniverse.id,
            testUser.id
          )
        }
      },
      { iterations: 10 }
    )

    bench(
      'Universe service - get by ID with user progress',
      async () => {
        const testUniverse = testData.universes[0]
        const testUser = testData.users[0]

        if (testUniverse && testUser) {
          await universeService.getByIdWithUserProgress(
            testUniverse.id,
            testUser.id
          )
        }
      },
      { iterations: 5 }
    )

    bench(
      'Universe service - get with content stats',
      async () => {
        const testUniverse = testData.universes[0]

        if (testUniverse) {
          await universeService.getWithContentStats(testUniverse.id)
        }
      },
      { iterations: 8 }
    )
  })

  describe('Concurrent Operations', () => {
    bench(
      'Concurrent user queries',
      async () => {
        const promises = testData.users.slice(0, 20).map(async user => {
          return await db.select().from(users).where(eq(users.id, user.id))
        })

        await Promise.all(promises)
      },
      { iterations: 5 }
    )

    bench(
      'Concurrent progress updates',
      async () => {
        const progressUpdates = testData.progress
          .slice(0, 10)
          .map(async progress => {
            return await db
              .update(userProgress)
              .set({ progress: Math.random() })
              .where(eq(userProgress.id, progress.id))
          })

        await Promise.all(progressUpdates)
      },
      { iterations: 3 }
    )
  })
})

/**
 * Generate realistic test data for performance testing
 */
async function generateTestData(size: number): Promise<TestData> {
  const data: TestData = {
    users: [],
    universes: [],
    content: [],
    relationships: [],
    progress: [],
    favorites: [],
  }

  // Generate users (10% of size)
  const userCount = Math.max(Math.floor(size * 0.1), 10)
  for (let i = 0; i < userCount; i++) {
    data.users.push({
      id: `perf_user_${i}`,
      email: `perfuser${i}@example.com`,
      passwordHash: `hash_${i}`,
      name: `Performance User ${i}`,
    })
  }

  // Insert users first
  await db.insert(users).values(data.users)

  // Generate universes (20% of size, distributed among users)
  const universeCount = Math.max(Math.floor(size * 0.2), 20)
  for (let i = 0; i < universeCount; i++) {
    const userId = data.users[i % data.users.length].id
    data.universes.push({
      id: `perf_universe_${i}`,
      name: `Performance Universe ${i}`,
      description: `Test universe ${i} for performance testing`,
      userId,
      isPublic: i % 3 === 0, // Make some public
    })
  }

  // Insert universes
  await db.insert(universes).values(data.universes)

  // Generate content (remaining size, distributed among universes)
  const contentCount = size
  for (let i = 0; i < contentCount; i++) {
    const universe = data.universes[i % data.universes.length]
    data.content.push({
      id: `perf_content_${i}`,
      name: `Performance Content ${i}`,
      description: `Test content ${i} for performance testing`,
      universeId: universe.id,
      userId: universe.userId,
      isViewable: i % 4 !== 0, // Most content is viewable
      mediaType: ['video', 'article', 'podcast', 'course'][i % 4],
    })
  }

  // Insert content
  await db.insert(content).values(data.content)

  // Generate relationships (create hierarchies)
  const relationshipCount = Math.floor(contentCount * 0.3) // 30% of content has relationships
  for (let i = 0; i < relationshipCount; i++) {
    const parentContent = data.content[i]
    const childContent = data.content[i + Math.floor(contentCount * 0.7)] // Later content as children

    if (
      parentContent &&
      childContent &&
      parentContent.universeId === childContent.universeId
    ) {
      data.relationships.push({
        id: `perf_rel_${i}`,
        parentId: parentContent.id,
        childId: childContent.id,
        universeId: parentContent.universeId,
        userId: parentContent.userId,
        displayOrder: i,
      })
    }
  }

  // Insert relationships
  if (data.relationships.length > 0) {
    await db.insert(contentRelationships).values(data.relationships)
  }

  // Generate progress records (50% of content has progress)
  const progressCount = Math.floor(contentCount * 0.5)
  for (let i = 0; i < progressCount; i++) {
    const contentItem = data.content[i]
    const user = data.users[i % data.users.length]

    data.progress.push({
      id: `perf_progress_${i}`,
      userId: user.id,
      contentId: contentItem.id,
      universeId: contentItem.universeId,
      progress: Math.random(), // Random progress 0-1
    })
  }

  // Insert progress
  if (data.progress.length > 0) {
    await db.insert(userProgress).values(data.progress)
  }

  // Generate favorites (20% of content is favorited)
  const favoriteCount = Math.floor(contentCount * 0.2)
  for (let i = 0; i < favoriteCount; i++) {
    const contentItem = data.content[i]
    const user = data.users[i % data.users.length]

    data.favorites.push({
      id: `perf_favorite_${i}`,
      userId: user.id,
      targetId: contentItem.id,
      targetType: 'content',
    })
  }

  // Insert favorites
  if (data.favorites.length > 0) {
    await db.insert(favorites).values(data.favorites)
  }

  return data
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  // Delete in reverse order of dependencies
  await db.delete(favorites).where(sql`id LIKE 'perf_favorite_%'`)
  await db.delete(userProgress).where(sql`id LIKE 'perf_progress_%'`)
  await db.delete(contentRelationships).where(sql`id LIKE 'perf_rel_%'`)
  await db.delete(content).where(sql`id LIKE 'perf_content_%'`)
  await db.delete(universes).where(sql`id LIKE 'perf_universe_%'`)
  await db.delete(users).where(sql`id LIKE 'perf_user_%'`)

  // Clean up any benchmark-created users
  if (testUserIds.length > 0) {
    for (const userId of testUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
    testUserIds = []
  }
}
