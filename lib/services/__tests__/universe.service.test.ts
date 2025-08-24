import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Universe, NewUniverse } from '@/lib/db/schema'

// Create comprehensive mock database with realistic method chaining
const mockDb = {
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
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
}

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Mock other dependencies with comprehensive implementations
vi.mock('@/lib/db/optimized-queries', () => ({
  OptimizedQueries: {
    getPublicUniverses: vi.fn(),
    getUniversesByUser: vi.fn(),
    getUniverseById: vi.fn(),
    searchUniverses: vi.fn(),
  },
}))

vi.mock('@/lib/db/connection-pool', () => ({
  withPerformanceMonitoring: vi.fn(fn => fn),
}))

// Test data factories
const createMockUniverse = (overrides: Partial<Universe> = {}): Universe => ({
  id: 'test-universe-123',
  name: 'Test Universe',
  description: 'A test universe for unit testing',
  userId: 'test-user-123',
  isPublic: false,
  sourceLink: null,
  sourceLinkName: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockUniverses = (count: number): Universe[] =>
  Array.from({ length: count }, (_, index) =>
    createMockUniverse({
      id: `test-universe-${index + 1}`,
      name: `Test Universe ${index + 1}`,
      description: `Test universe ${index + 1} description`,
    })
  )

describe('Universe Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getById', () => {
    it('should return universe when found', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { withPerformanceMonitoring } = await import(
        '@/lib/db/connection-pool'
      )
      const { universeService } = await import('../universe.service')

      const mockUniverse = createMockUniverse()
      vi.mocked(OptimizedQueries.getUniverseById).mockResolvedValue(
        mockUniverse
      )
      vi.mocked(withPerformanceMonitoring).mockImplementation(fn => fn)

      const result = await universeService.getById('test-universe-123')

      expect(withPerformanceMonitoring).toHaveBeenCalledWith(
        OptimizedQueries.getUniverseById,
        'universe.getById'
      )
      expect(OptimizedQueries.getUniverseById).toHaveBeenCalledWith(
        'test-universe-123'
      )
      expect(result).toEqual(mockUniverse)
    })

    it('should return null when universe not found', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      vi.mocked(OptimizedQueries.getUniverseById).mockResolvedValue(null)

      const result = await universeService.getById('non-existent-universe')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create universe with timestamps', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverse = createMockUniverse()
      mockDb.insert().values().returning.mockResolvedValue([mockUniverse])

      const universeData: NewUniverse = {
        name: 'Test Universe',
        description: 'A test universe',
        userId: 'test-user-123',
        isPublic: false,
      }

      const result = await universeService.create(universeData)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result).toEqual(mockUniverse)
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      mockDb
        .insert()
        .values()
        .returning.mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const universeData: NewUniverse = {
        name: 'Test Universe',
        description: 'A test universe',
        userId: 'test-user-123',
        isPublic: false,
      }

      await expect(universeService.create(universeData)).rejects.toThrow(
        'Failed to create universe'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating universe:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('update', () => {
    it('should update universe with timestamps', async () => {
      const { universeService } = await import('../universe.service')

      const updatedUniverse = createMockUniverse({ name: 'Updated Universe' })
      mockDb
        .update()
        .set()
        .where()
        .returning.mockResolvedValue([updatedUniverse])

      const result = await universeService.update('test-universe-123', {
        name: 'Updated Universe',
      })

      expect(mockDb.update).toHaveBeenCalled()
      expect(result).toEqual(updatedUniverse)
    })

    it('should return null when universe not found', async () => {
      const { universeService } = await import('../universe.service')

      mockDb.update().set().where().returning.mockResolvedValue([])

      const result = await universeService.update('non-existent-universe', {
        name: 'Updated Universe',
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      mockDb
        .update()
        .set()
        .where()
        .returning.mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        universeService.update('test-universe-123', {
          name: 'Updated Universe',
        })
      ).rejects.toThrow('Failed to update universe')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating universe:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('delete', () => {
    it('should delete universe successfully', async () => {
      const { universeService } = await import('../universe.service')

      mockDb.delete().where.mockResolvedValue(undefined)

      await universeService.delete('test-universe-123')

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.delete().where).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(universeService.delete('test-universe-123')).rejects.toThrow(
        'Failed to delete universe'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting universe:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getByUserId', () => {
    it('should return user universes', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      vi.mocked(OptimizedQueries.getUniversesByUser).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getByUserId('test-user-123')

      expect(OptimizedQueries.getUniversesByUser).toHaveBeenCalledWith(
        'test-user-123'
      )
      expect(result).toEqual(mockUniverses)
      expect(result).toHaveLength(3)
    })

    it('should return empty array when user has no universes', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      vi.mocked(OptimizedQueries.getUniversesByUser).mockResolvedValue([])

      const result = await universeService.getByUserId('test-user-123')

      expect(result).toEqual([])
    })
  })

  describe('getPublicUniverses', () => {
    it('should return public universes without search', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(5)
      vi.mocked(OptimizedQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
      })

      expect(OptimizedQueries.getPublicUniverses).toHaveBeenCalledWith(20)
      expect(result).toEqual(mockUniverses)
    })

    it('should use search when searchQuery provided', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(2)
      vi.mocked(OptimizedQueries.searchUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
        searchQuery: 'test search',
      })

      expect(OptimizedQueries.searchUniverses).toHaveBeenCalledWith(
        'test search',
        20
      )
      expect(result).toEqual(mockUniverses)
    })

    it('should ignore empty search query', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      vi.mocked(OptimizedQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
        searchQuery: '   ',
      })

      expect(OptimizedQueries.getPublicUniverses).toHaveBeenCalledWith(20)
      expect(OptimizedQueries.searchUniverses).not.toHaveBeenCalled()
      expect(result).toEqual(mockUniverses)
    })

    it('should use default limit when not provided', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(2)
      vi.mocked(OptimizedQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses()

      expect(OptimizedQueries.getPublicUniverses).toHaveBeenCalledWith(20)
      expect(result).toEqual(mockUniverses)
    })
  })

  describe('calculateUniverseProgress', () => {
    it('should calculate progress correctly', async () => {
      const { universeService } = await import('../universe.service')

      // Mock viewable content query
      const viewableContentQuery = vi
        .fn()
        .mockResolvedValue([
          { id: 'content-1' },
          { id: 'content-2' },
          { id: 'content-3' },
        ])

      // Mock progress data query
      const progressDataQuery = vi
        .fn()
        .mockResolvedValue([
          { progress: 100 },
          { progress: 50 },
          { progress: 75 },
        ])

      mockDb.select().from().where.mockResolvedValueOnce(viewableContentQuery())
      mockDb.select().from().where.mockResolvedValueOnce(progressDataQuery())

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      // Average: (100 + 50 + 75) / 3 = 75
      expect(result).toBe(75)
    })

    it('should return 0 when no viewable content exists', async () => {
      const { universeService } = await import('../universe.service')

      mockDb.select().from().where.mockResolvedValue([])

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(0)
    })

    it('should return 0 when no progress data exists', async () => {
      const { universeService } = await import('../universe.service')

      // Mock viewable content exists
      mockDb
        .select()
        .from()
        .where.mockResolvedValueOnce([{ id: 'content-1' }])
        .mockResolvedValueOnce([])

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { universeService } = await import('../universe.service')

      mockDb
        .select()
        .from()
        .where.mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calculating universe progress:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should clamp progress to 0-100 range', async () => {
      const { universeService } = await import('../universe.service')

      // Mock extreme values
      mockDb
        .select()
        .from()
        .where.mockResolvedValueOnce([{ id: 'content-1' }])
        .mockResolvedValueOnce([{ progress: 150 }]) // Over 100

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(100) // Should be clamped to 100
    })
  })

  describe('getByIdWithUserProgress', () => {
    it('should return universe with progress', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverse = createMockUniverse()

      // Mock the getById method
      vi.spyOn(universeService, 'getById').mockResolvedValue(mockUniverse)
      // Mock the calculateUniverseProgress method
      vi.spyOn(universeService, 'calculateUniverseProgress').mockResolvedValue(
        75
      )

      const result = await universeService.getByIdWithUserProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toEqual({
        ...mockUniverse,
        progress: 75,
      })
    })

    it('should return null when universe not found', async () => {
      const { universeService } = await import('../universe.service')

      vi.spyOn(universeService, 'getById').mockResolvedValue(null)

      const result = await universeService.getByIdWithUserProgress(
        'non-existent',
        'test-user-123'
      )

      expect(result).toBeNull()
    })

    it('should handle errors', async () => {
      const { universeService } = await import('../universe.service')

      vi.spyOn(universeService, 'getById').mockRejectedValue(
        new Error('Database error')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        universeService.getByIdWithUserProgress(
          'test-universe-123',
          'test-user-123'
        )
      ).rejects.toThrow('Failed to fetch universe with user progress')

      consoleSpy.mockRestore()
    })
  })

  describe('searchPublic', () => {
    it('should search public universes by name', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(2)
      // Create a complete chain mock for this specific test
      const chainMock = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockUniverses),
            }),
          }),
        }),
      }
      mockDb.select.mockReturnValue(chainMock)

      const result = await universeService.searchPublic('test search', 10)

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual(mockUniverses)
    })

    it('should use default limit', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      const chainMock = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockUniverses),
            }),
          }),
        }),
      }
      mockDb.select.mockReturnValue(chainMock)

      const result = await universeService.searchPublic('test search')

      expect(result).toEqual(mockUniverses)
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      const chainMock = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      }
      mockDb.select.mockReturnValue(chainMock)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(universeService.searchPublic('test search')).rejects.toThrow(
        'Failed to search public universes'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error searching public universes:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
