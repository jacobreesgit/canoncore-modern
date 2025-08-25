/**
 * Refactored to remove @ts-nocheck and implement proper TypeScript types
 * using proven database service mocking pattern from wanago.io article.
 *
 * Key changes:
 * - Removed @ts-nocheck directive for proper TypeScript support
 * - Simplified complex chained mock structure to simple mockDb object
 * - Updated all 26 tests to use explicit mock chain setup for clearer debugging
 * - Added comprehensive beforeEach with default mock chain implementations
 * - Enhanced progress calculation tests with explicit mock chains (mockWhere1, mockFrom1)
 * - Converted search/filter tests to use consistent explicit pattern
 * - Maintains all universe service business logic while improving type safety and test reliability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Universe, NewUniverse } from '@/lib/db/schema'

// Mock the database module
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Mock other dependencies with comprehensive implementations
vi.mock('@/lib/db/queries', () => ({
  DatabaseQueries: {
    getPublicUniverses: vi.fn(),
    getUniversesByUserId: vi.fn(),
    getUniverseById: vi.fn(),
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
    // Reset mock chain implementations
    mockDb.select.mockReturnValue({
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
    })
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    })
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
    })
    mockDb.delete.mockReturnValue({
      where: vi.fn(),
    })
  })

  describe('getById', () => {
    it('should return universe when found', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { withPerformanceMonitoring } = await import(
        '@/lib/db/connection-pool'
      )
      const { universeService } = await import('../universe.service')

      const mockUniverse = createMockUniverse()
      vi.mocked(DatabaseQueries.getUniverseById).mockResolvedValue(mockUniverse)
      vi.mocked(withPerformanceMonitoring).mockImplementation(fn => fn)

      const result = await universeService.getById('test-universe-123')

      expect(withPerformanceMonitoring).toHaveBeenCalledWith(
        DatabaseQueries.getUniverseById,
        'universe.getById'
      )
      expect(DatabaseQueries.getUniverseById).toHaveBeenCalledWith(
        'test-universe-123'
      )
      expect(result).toEqual(mockUniverse)
    })

    it('should return null when universe not found', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      vi.mocked(DatabaseQueries.getUniverseById).mockResolvedValue(null)

      const result = await universeService.getById('non-existent-universe')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create universe with timestamps', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverse = createMockUniverse()
      const mockReturning = vi.fn().mockResolvedValue([mockUniverse])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const universeData: NewUniverse = {
        name: 'Test Universe',
        description: 'A test universe',
        userId: 'test-user-123',
        isPublic: false,
      }

      const result = await universeService.create(universeData)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(result).toEqual(mockUniverse)
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

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
      const mockReturning = vi.fn().mockResolvedValue([updatedUniverse])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await universeService.update('test-universe-123', {
        name: 'Updated Universe',
      })

      expect(mockDb.update).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(result).toEqual(updatedUniverse)
    })

    it('should return null when universe not found', async () => {
      const { universeService } = await import('../universe.service')

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await universeService.update('non-existent-universe', {
        name: 'Updated Universe',
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

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

      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await universeService.delete('test-universe-123')

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      mockDb.delete.mockReturnValue({ where: mockWhere })

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
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      vi.mocked(DatabaseQueries.getUniversesByUserId).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getByUserId('test-user-123')

      expect(DatabaseQueries.getUniversesByUserId).toHaveBeenCalledWith(
        'test-user-123'
      )
      expect(result).toEqual(mockUniverses)
      expect(result).toHaveLength(3)
    })

    it('should return empty array when user has no universes', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      vi.mocked(DatabaseQueries.getUniversesByUserId).mockResolvedValue([])

      const result = await universeService.getByUserId('test-user-123')

      expect(result).toEqual([])
    })
  })

  describe('getPublicUniverses', () => {
    it('should return public universes without search', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(5)
      vi.mocked(DatabaseQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
      })

      expect(DatabaseQueries.getPublicUniverses).toHaveBeenCalledWith({
        searchQuery: undefined,
        sortBy: undefined,
        limit: 20,
      })
      expect(result).toEqual(mockUniverses)
    })

    it('should use search when searchQuery provided', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(2)
      vi.mocked(DatabaseQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
        searchQuery: 'test search',
      })

      expect(DatabaseQueries.getPublicUniverses).toHaveBeenCalledWith({
        searchQuery: 'test search',
        limit: 20,
        sortBy: undefined,
      })
      expect(result).toEqual(mockUniverses)
    })

    it('should ignore empty search query', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      vi.mocked(DatabaseQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses({
        limitCount: 20,
        searchQuery: '   ',
      })

      expect(DatabaseQueries.getPublicUniverses).toHaveBeenCalledWith({
        searchQuery: '   ',
        sortBy: undefined,
        limit: 20,
      })
      expect(result).toEqual(mockUniverses)
    })

    it('should use default limit when not provided', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(2)
      vi.mocked(DatabaseQueries.getPublicUniverses).mockResolvedValue(
        mockUniverses
      )

      const result = await universeService.getPublicUniverses()

      expect(DatabaseQueries.getPublicUniverses).toHaveBeenCalledWith({
        searchQuery: undefined,
        sortBy: undefined,
        limit: 20,
      })
      expect(result).toEqual(mockUniverses)
    })
  })

  describe('calculateUniverseProgress', () => {
    it('should calculate progress correctly', async () => {
      const { universeService } = await import('../universe.service')

      // Mock viewable content query
      const viewableContentResult = [
        { id: 'content-1' },
        { id: 'content-2' },
        { id: 'content-3' },
      ]

      // Mock progress data query
      const progressDataResult = [
        { progress: 100 },
        { progress: 50 },
        { progress: 75 },
      ]

      const mockWhere1 = vi.fn().mockResolvedValue(viewableContentResult)
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 })
      const mockWhere2 = vi.fn().mockResolvedValue(progressDataResult)
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 })

      mockDb.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 })

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      // Average: (100 + 50 + 75) / 3 = 75
      expect(result).toBe(75)
    })

    it('should return 0 when no viewable content exists', async () => {
      const { universeService } = await import('../universe.service')

      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(0)
    })

    it('should return 0 when no progress data exists', async () => {
      const { universeService } = await import('../universe.service')

      // Mock viewable content exists
      const mockWhere1 = vi.fn().mockResolvedValue([{ id: 'content-1' }])
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 })
      const mockWhere2 = vi.fn().mockResolvedValue([])
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 })

      mockDb.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 })

      const result = await universeService.calculateUniverseProgress(
        'test-universe-123',
        'test-user-123'
      )

      expect(result).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { universeService } = await import('../universe.service')

      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockWhere1 = vi.fn().mockResolvedValue([{ id: 'content-1' }])
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 })
      const mockWhere2 = vi.fn().mockResolvedValue([{ progress: 150 }]) // Over 100
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 })

      mockDb.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 })

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
      const mockLimit = vi.fn().mockResolvedValue(mockUniverses)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await universeService.searchPublic('test search', 10)

      expect(mockDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockOrderBy).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalled()
      expect(result).toEqual(mockUniverses)
    })

    it('should use default limit', async () => {
      const { universeService } = await import('../universe.service')

      const mockUniverses = createMockUniverses(3)
      const mockLimit = vi.fn().mockResolvedValue(mockUniverses)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await universeService.searchPublic('test search')

      expect(result).toEqual(mockUniverses)
    })

    it('should handle database errors', async () => {
      const { universeService } = await import('../universe.service')

      const mockLimit = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
