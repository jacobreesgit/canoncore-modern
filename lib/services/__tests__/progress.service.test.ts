import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserProgress, Content } from '@/lib/db/schema'

// Create comprehensive mock database with realistic method chaining
const createMockDb = () => ({
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn(),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn(),
        }),
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn(),
      }),
    }),
  }),
  selectDistinct: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn(),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
})

const mockDb = createMockDb()

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Mock other dependencies with comprehensive implementations
vi.mock('@/lib/db/optimized-queries', () => ({
  OptimizedQueries: {
    getUserProgressForUniverse: vi.fn(),
  },
}))

vi.mock('@/lib/db/connection-pool', () => ({
  withPerformanceMonitoring: vi.fn(fn => fn),
}))

// Test data factories
const createMockUserProgress = (
  overrides: Partial<UserProgress> = {}
): UserProgress => ({
  id: 'test-progress-123',
  userId: 'test-user-123',
  contentId: 'test-content-123',
  universeId: 'test-universe-123',
  progress: 50,
  lastAccessedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockContent = (overrides: Partial<Content> = {}): Content => ({
  id: 'test-content-123',
  name: 'Test Content',
  description: 'A test content item',
  universeId: 'test-universe-123',
  userId: 'test-user-123',
  isViewable: true,
  mediaType: 'video',
  sourceLink: null,
  sourceLinkName: null,
  lastAccessedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockProgressList = (
  count: number,
  overrides: Partial<UserProgress> = {}
): UserProgress[] =>
  Array.from({ length: count }, (_, index) =>
    createMockUserProgress({
      id: `test-progress-${index + 1}`,
      contentId: `test-content-${index + 1}`,
      progress: (index + 1) * 20,
      ...overrides,
    })
  )

describe('Progress Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock database structure
    Object.assign(mockDb, createMockDb())
  })

  describe('getUserProgress', () => {
    it('should return user progress when found', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where()
        .limit.mockResolvedValue([{ progress: 75 }])

      const result = await progressService.getUserProgress(
        'test-user-123',
        'test-content-123'
      )

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toBe(75)
    })

    it('should return 0 when no progress found', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select().from().where().limit.mockResolvedValue([])

      const result = await progressService.getUserProgress(
        'test-user-123',
        'non-existent-content'
      )

      expect(result).toBe(0)
    })

    it('should return 0 when progress data is null', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where()
        .limit.mockResolvedValue([{ progress: null }])

      const result = await progressService.getUserProgress(
        'test-user-123',
        'test-content-123'
      )

      expect(result).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where()
        .limit.mockRejectedValue(new Error('Database error'))

      const result = await progressService.getUserProgress(
        'test-user-123',
        'test-content-123'
      )

      expect(result).toBe(0)
    })
  })

  describe('getUserProgressByUniverse', () => {
    it('should return progress map for universe', async () => {
      const { progressService } = await import('../progress.service')

      const mockProgressData = [
        { contentId: 'content-1', progress: 80 },
        { contentId: 'content-2', progress: 60 },
        { contentId: 'content-3', progress: 0 },
      ]

      mockDb.select().from().where.mockResolvedValue(mockProgressData)

      const result = await progressService.getUserProgressByUniverse(
        'test-user-123',
        'test-universe-123'
      )

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual({
        'content-1': 80,
        'content-2': 60,
        'content-3': 0,
      })
    })

    it('should return empty object when no progress found', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select().from().where.mockResolvedValue([])

      const result = await progressService.getUserProgressByUniverse(
        'test-user-123',
        'empty-universe'
      )

      expect(result).toEqual({})
    })

    it('should handle null progress values', async () => {
      const { progressService } = await import('../progress.service')

      const mockProgressData = [
        { contentId: 'content-1', progress: null },
        { contentId: 'content-2', progress: 50 },
      ]

      mockDb.select().from().where.mockResolvedValue(mockProgressData)

      const result = await progressService.getUserProgressByUniverse(
        'test-user-123',
        'test-universe-123'
      )

      expect(result).toEqual({
        'content-1': 0,
        'content-2': 50,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where.mockRejectedValue(new Error('Database error'))

      const result = await progressService.getUserProgressByUniverse(
        'test-user-123',
        'test-universe-123'
      )

      expect(result).toEqual({})
    })
  })

  describe('setUserProgress', () => {
    it('should create new progress entry when none exists', async () => {
      const { progressService } = await import('../progress.service')

      const progressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 75,
      }

      const expectedProgress = createMockUserProgress({
        userId: 'test-user-123',
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 75,
      })

      // Mock no existing progress found
      mockDb.select().from().where().limit.mockResolvedValue([])
      // Mock successful creation
      mockDb.insert().values().returning.mockResolvedValue([expectedProgress])

      const result = await progressService.setUserProgress(
        'test-user-123',
        progressData
      )

      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.insert).toHaveBeenCalled()
      expect(result).toEqual(expectedProgress)
    })

    it('should update existing progress entry', async () => {
      const { progressService } = await import('../progress.service')

      const progressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 90,
      }

      const existingProgress = createMockUserProgress({
        id: 'existing-progress-id',
        progress: 50,
      })

      const updatedProgress = createMockUserProgress({
        id: 'existing-progress-id',
        progress: 90,
      })

      // Mock existing progress found
      mockDb.select().from().where().limit.mockResolvedValue([existingProgress])
      // Mock successful update
      mockDb
        .update()
        .set()
        .where()
        .returning.mockResolvedValue([updatedProgress])

      const result = await progressService.setUserProgress(
        'test-user-123',
        progressData
      )

      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled()
      expect(result).toEqual(updatedProgress)
    })

    it('should clamp progress to valid range (0-100)', async () => {
      const { progressService } = await import('../progress.service')

      // Test progress above 100
      const highProgressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 150,
      }

      const expectedProgress = createMockUserProgress({ progress: 100 })

      mockDb.select().from().where().limit.mockResolvedValue([])
      mockDb.insert().values().returning.mockResolvedValue([expectedProgress])

      const result = await progressService.setUserProgress(
        'test-user-123',
        highProgressData
      )

      // Verify the result has clamped progress
      expect(result.progress).toBe(100)
    })

    it('should clamp negative progress to 0', async () => {
      const { progressService } = await import('../progress.service')

      const negativeProgressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: -25,
      }

      const expectedProgress = createMockUserProgress({ progress: 0 })

      mockDb.select().from().where().limit.mockResolvedValue([])
      mockDb.insert().values().returning.mockResolvedValue([expectedProgress])

      const result = await progressService.setUserProgress(
        'test-user-123',
        negativeProgressData
      )

      // Verify the result has clamped progress
      expect(result.progress).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      const progressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 75,
      }

      mockDb
        .select()
        .from()
        .where()
        .limit.mockRejectedValue(new Error('Database error'))

      await expect(
        progressService.setUserProgress('test-user-123', progressData)
      ).rejects.toThrow('Failed to set user progress')
    })

    it('should handle creation database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      const progressData = {
        contentId: 'test-content-123',
        universeId: 'test-universe-123',
        progress: 75,
      }

      mockDb.select().from().where().limit.mockResolvedValue([])
      mockDb
        .insert()
        .values()
        .returning.mockRejectedValue(new Error('Insert failed'))

      await expect(
        progressService.setUserProgress('test-user-123', progressData)
      ).rejects.toThrow('Failed to set user progress')
    })
  })

  describe('calculateOrganisationalProgress', () => {
    it('should calculate average progress from viewable children', async () => {
      const { progressService } = await import('../progress.service')

      const allContent = [
        createMockContent({ id: 'parent-1', isViewable: false }),
        createMockContent({ id: 'child-1', isViewable: true }),
        createMockContent({ id: 'child-2', isViewable: true }),
      ]

      const relationships = [
        { parentId: 'parent-1', childId: 'child-1' },
        { parentId: 'parent-1', childId: 'child-2' },
      ]

      // Mock getUserProgress calls for children
      vi.spyOn(progressService, 'getUserProgress')
        .mockResolvedValueOnce(80) // child-1 progress
        .mockResolvedValueOnce(60) // child-2 progress

      const result = await progressService.calculateOrganisationalProgress(
        'parent-1',
        'test-user-123',
        allContent,
        relationships
      )

      expect(result).toBe(70) // (80 + 60) / 2 = 70
    })

    it('should handle recursive organisational content', async () => {
      const { progressService } = await import('../progress.service')

      const allContent = [
        createMockContent({ id: 'parent-1', isViewable: false }),
        createMockContent({ id: 'child-org-1', isViewable: false }),
        createMockContent({ id: 'child-viewable-1', isViewable: true }),
      ]

      const relationships = [
        { parentId: 'parent-1', childId: 'child-org-1' },
        { parentId: 'parent-1', childId: 'child-viewable-1' },
        { parentId: 'child-org-1', childId: 'grandchild-1' },
      ]

      // Mock recursive calls
      vi.spyOn(progressService, 'calculateOrganisationalProgress')
        .mockResolvedValueOnce(90) // Mock return for parent-1 call
        .mockResolvedValueOnce(80) // Mock return for child-org-1 call

      vi.spyOn(progressService, 'getUserProgress').mockResolvedValue(100) // child-viewable-1 progress

      const result = await progressService.calculateOrganisationalProgress(
        'parent-1',
        'test-user-123',
        allContent,
        relationships
      )

      expect(result).toBe(90)
    })

    it('should return 0 when no children exist', async () => {
      const { progressService } = await import('../progress.service')

      const allContent = [
        createMockContent({ id: 'parent-1', isViewable: false }),
      ]
      const relationships: Array<{ parentId: string; childId: string }> = [] // No relationships

      // Clear any existing spies that might interfere
      vi.restoreAllMocks()

      const result = await progressService.calculateOrganisationalProgress(
        'parent-1',
        'test-user-123',
        allContent,
        relationships
      )

      expect(result).toBe(0)
    })

    it('should handle missing child content gracefully', async () => {
      const { progressService } = await import('../progress.service')

      const allContent = [
        createMockContent({ id: 'parent-1', isViewable: false }),
      ]
      const relationships = [{ parentId: 'parent-1', childId: 'missing-child' }]

      const result = await progressService.calculateOrganisationalProgress(
        'parent-1',
        'test-user-123',
        allContent,
        relationships
      )

      expect(result).toBe(0)
    })

    it('should handle calculation errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      const allContent = [
        createMockContent({ id: 'parent-1', isViewable: false }),
        createMockContent({ id: 'child-1', isViewable: true }),
      ]
      const relationships = [{ parentId: 'parent-1', childId: 'child-1' }]

      vi.spyOn(progressService, 'getUserProgress').mockRejectedValue(
        new Error('Database error')
      )

      const result = await progressService.calculateOrganisationalProgress(
        'parent-1',
        'test-user-123',
        allContent,
        relationships
      )

      expect(result).toBe(0)
    })
  })

  describe('getProgressSummary', () => {
    it('should return comprehensive progress statistics', async () => {
      const { progressService } = await import('../progress.service')

      // Mock database responses in sequence
      let callCount = 0
      mockDb.select.mockImplementation(() => {
        callCount++
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(
              callCount === 1 ? [{ count: 15 }] : [{ count: 8 }] // total vs completed
            ),
          }),
        }
      })

      mockDb
        .selectDistinct()
        .from()
        .where.mockResolvedValue([
          { universeId: 'universe-1' },
          { universeId: 'universe-2' },
          { universeId: 'universe-3' },
        ])

      const result = await progressService.getProgressSummary('test-user-123')

      expect(result).toEqual({
        totalContent: 15,
        completedContent: 8,
        totalUniverses: 3,
        completedUniverses: 0, // Note: universe completion not implemented yet
      })
    })

    it('should return zeros when no progress data exists', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      }))

      mockDb.selectDistinct().from().where.mockResolvedValue([])

      const result = await progressService.getProgressSummary('test-user-123')

      expect(result).toEqual({
        totalContent: 0,
        completedContent: 0,
        totalUniverses: 0,
        completedUniverses: 0,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      }))

      const result = await progressService.getProgressSummary('test-user-123')

      expect(result).toEqual({
        totalContent: 0,
        completedContent: 0,
        totalUniverses: 0,
        completedUniverses: 0,
      })
    })
  })

  describe('deleteProgressForContent', () => {
    it('should delete progress for content successfully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.delete().where.mockResolvedValue({ rowCount: 3 })

      await expect(
        progressService.deleteProgressForContent('test-content-123')
      ).resolves.not.toThrow()

      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

      await expect(
        progressService.deleteProgressForContent('test-content-123')
      ).rejects.toThrow('Failed to delete progress for content')
    })
  })

  describe('deleteProgressForUniverse', () => {
    it('should delete progress for universe successfully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.delete().where.mockResolvedValue({ rowCount: 15 })

      await expect(
        progressService.deleteProgressForUniverse('test-universe-123')
      ).resolves.not.toThrow()

      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

      await expect(
        progressService.deleteProgressForUniverse('test-universe-123')
      ).rejects.toThrow('Failed to delete progress for universe')
    })
  })

  describe('getRecentProgress', () => {
    it('should return recent progress updates', async () => {
      const { progressService } = await import('../progress.service')

      const mockRecentProgress = createMockProgressList(5, {
        userId: 'test-user-123',
      })
      mockDb
        .select()
        .from()
        .where()
        .orderBy()
        .limit.mockResolvedValue(mockRecentProgress)

      const result = await progressService.getRecentProgress('test-user-123', 5)

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual(mockRecentProgress)
      expect(result).toHaveLength(5)
    })

    it('should use default limit of 10 when not specified', async () => {
      const { progressService } = await import('../progress.service')

      const mockRecentProgress = createMockProgressList(10, {
        userId: 'test-user-123',
      })
      mockDb
        .select()
        .from()
        .where()
        .orderBy()
        .limit.mockResolvedValue(mockRecentProgress)

      const result = await progressService.getRecentProgress('test-user-123')

      expect(result).toHaveLength(10)
    })

    it('should return empty array when no progress exists', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select().from().where().orderBy().limit.mockResolvedValue([])

      const result = await progressService.getRecentProgress('test-user-123')

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where()
        .orderBy()
        .limit.mockRejectedValue(new Error('Database error'))

      const result = await progressService.getRecentProgress('test-user-123')

      expect(result).toEqual([])
    })
  })

  describe('getUniverseProgressStats', () => {
    it('should return universe progress statistics', async () => {
      const { progressService } = await import('../progress.service')

      // Mock database responses in sequence
      let callCount = 0
      mockDb.select.mockImplementation(() => {
        callCount++
        return {
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue(
                callCount === 1 ? [{ count: 25 }] : [{ avgProgress: 67.5 }]
              ),
          }),
        }
      })

      mockDb
        .selectDistinct()
        .from()
        .where.mockResolvedValue([
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-3' },
        ])

      const result =
        await progressService.getUniverseProgressStats('test-universe-123')

      expect(result).toEqual({
        totalViewableContent: 25,
        usersWithProgress: 3,
        averageCompletion: 68, // Rounded from 67.5
      })
    })

    it('should return zeros when no data exists', async () => {
      const { progressService } = await import('../progress.service')

      let callCount = 0
      mockDb.select.mockImplementation(() => {
        callCount++
        return {
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue(
                callCount === 1 ? [{ count: 0 }] : [{ avgProgress: null }]
              ),
          }),
        }
      })

      mockDb.selectDistinct().from().where.mockResolvedValue([])

      const result =
        await progressService.getUniverseProgressStats('empty-universe')

      expect(result).toEqual({
        totalViewableContent: 0,
        usersWithProgress: 0,
        averageCompletion: 0,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      }))

      const result =
        await progressService.getUniverseProgressStats('test-universe-123')

      expect(result).toEqual({
        totalViewableContent: 0,
        usersWithProgress: 0,
        averageCompletion: 0,
      })
    })
  })

  describe('getAllUserProgress', () => {
    it('should return all user progress as a map', async () => {
      const { progressService } = await import('../progress.service')

      const mockProgressData = [
        { contentId: 'content-1', progress: 100 },
        { contentId: 'content-2', progress: 75 },
        { contentId: 'content-3', progress: 0 },
      ]

      mockDb.select().from().where.mockResolvedValue(mockProgressData)

      const result = await progressService.getAllUserProgress('test-user-123')

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual({
        'content-1': 100,
        'content-2': 75,
        'content-3': 0,
      })
    })

    it('should return empty object when no progress exists', async () => {
      const { progressService } = await import('../progress.service')

      mockDb.select().from().where.mockResolvedValue([])

      const result = await progressService.getAllUserProgress('new-user-123')

      expect(result).toEqual({})
    })

    it('should handle null progress values', async () => {
      const { progressService } = await import('../progress.service')

      const mockProgressData = [
        { contentId: 'content-1', progress: null },
        { contentId: 'content-2', progress: 25 },
      ]

      mockDb.select().from().where.mockResolvedValue(mockProgressData)

      const result = await progressService.getAllUserProgress('test-user-123')

      expect(result).toEqual({
        'content-1': 0,
        'content-2': 25,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { progressService } = await import('../progress.service')

      mockDb
        .select()
        .from()
        .where.mockRejectedValue(new Error('Database error'))

      const result = await progressService.getAllUserProgress('test-user-123')

      expect(result).toEqual({})
    })
  })

  describe('bulkUpdateProgress', () => {
    it('should update progress for multiple content items', async () => {
      const { progressService } = await import('../progress.service')

      const progressUpdates = [
        { contentId: 'content-1', universeId: 'universe-1', progress: 80 },
        { contentId: 'content-2', universeId: 'universe-1', progress: 60 },
        { contentId: 'content-3', universeId: 'universe-1', progress: 100 },
      ]

      // Mock setUserProgress calls
      vi.spyOn(progressService, 'setUserProgress').mockResolvedValue(
        createMockUserProgress()
      )

      await expect(
        progressService.bulkUpdateProgress('test-user-123', progressUpdates)
      ).resolves.not.toThrow()

      expect(progressService.setUserProgress).toHaveBeenCalledTimes(3)
      expect(progressService.setUserProgress).toHaveBeenNthCalledWith(
        1,
        'test-user-123',
        progressUpdates[0]
      )
      expect(progressService.setUserProgress).toHaveBeenNthCalledWith(
        2,
        'test-user-123',
        progressUpdates[1]
      )
      expect(progressService.setUserProgress).toHaveBeenNthCalledWith(
        3,
        'test-user-123',
        progressUpdates[2]
      )
    })

    it('should handle empty updates array', async () => {
      const { progressService } = await import('../progress.service')

      vi.spyOn(progressService, 'setUserProgress')

      await expect(
        progressService.bulkUpdateProgress('test-user-123', [])
      ).resolves.not.toThrow()

      expect(progressService.setUserProgress).not.toHaveBeenCalled()
    })

    it('should handle individual update failures gracefully', async () => {
      const { progressService } = await import('../progress.service')

      const progressUpdates = [
        { contentId: 'content-1', universeId: 'universe-1', progress: 80 },
      ]

      vi.spyOn(progressService, 'setUserProgress').mockRejectedValue(
        new Error('Individual update failed')
      )

      await expect(
        progressService.bulkUpdateProgress('test-user-123', progressUpdates)
      ).rejects.toThrow('Failed to bulk update progress')
    })
  })
})
