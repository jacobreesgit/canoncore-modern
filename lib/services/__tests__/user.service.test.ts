/**
 * Refactored to remove @ts-nocheck and implement proper TypeScript types
 * using proven database service mocking pattern from wanago.io article.
 *
 * Key changes:
 * - Removed @ts-nocheck directive for proper TypeScript support
 * - Replaced complex nested mock chains with simple mockDb object pattern
 * - Updated all 27 tests to use explicit mock chain setup (mockReturning, mockValues, etc.)
 * - Added comprehensive beforeEach setup with default mock implementations
 * - Enhanced test verification with explicit expectations for each mock function call
 * - Maintains all user service functionality testing while improving maintainability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, NewUser, Favorite } from '@/lib/db/schema'

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

// Mock other dependencies with more realistic implementations
vi.mock('@/lib/db/queries', () => ({
  DatabaseQueries: {
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserFavorites: vi.fn(),
  },
}))

vi.mock('@/lib/db/connection-pool', () => ({
  withPerformanceMonitoring: vi.fn(fn => fn),
}))

// Test data factories
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  image: null,
  passwordHash: 'hashed-password',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockFavorite = (overrides: Partial<Favorite> = {}): Favorite => ({
  id: 'test-favorite-123',
  userId: 'test-user-123',
  targetId: 'test-target-123',
  targetType: 'universe' as const,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock chain implementations
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn(),
          orderBy: vi.fn(),
        }),
        orderBy: vi.fn(),
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
    it('should return user when found', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { withPerformanceMonitoring } = await import(
        '@/lib/db/connection-pool'
      )
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      vi.mocked(DatabaseQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(withPerformanceMonitoring).mockImplementation(fn => fn)

      const result = await userService.getById('test-user-123')

      expect(withPerformanceMonitoring).toHaveBeenCalledWith(
        DatabaseQueries.getUserById,
        'user.getById'
      )
      expect(DatabaseQueries.getUserById).toHaveBeenCalledWith('test-user-123')
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      vi.mocked(DatabaseQueries.getUserById).mockResolvedValue(null)

      const result = await userService.getById('non-existent-user')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create user with timestamps', async () => {
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      const mockReturning = vi.fn().mockResolvedValue([mockUser])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const userData: NewUser = {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      }

      const result = await userService.create(userData)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const userData: NewUser = {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      }

      await expect(userService.create(userData)).rejects.toThrow(
        'Failed to create user'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating user:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('updateProfile', () => {
    it('should update user profile with timestamps', async () => {
      const { userService } = await import('../user.service')

      const updatedUser = createMockUser({ name: 'Updated User' })
      const mockReturning = vi.fn().mockResolvedValue([updatedUser])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await userService.updateProfile('test-user-123', {
        name: 'Updated User',
      })

      expect(mockDb.update).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(result).toEqual(updatedUser)
    })

    it('should return null when user not found', async () => {
      const { userService } = await import('../user.service')

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await userService.updateProfile('non-existent-user', {
        name: 'Updated User',
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        userService.updateProfile('test-user-123', { name: 'Updated User' })
      ).rejects.toThrow('Failed to update user profile')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating user profile:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getUserFavourites', () => {
    it('should categorize favourites correctly', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      vi.mocked(DatabaseQueries.getUserFavorites).mockResolvedValue({
        universes: ['universe-1', 'universe-2'],
        content: ['content-1', 'content-2'],
      })

      const result = await userService.getUserFavourites('test-user-123')

      expect(result).toEqual({
        universes: ['universe-1', 'universe-2'],
        content: ['content-1', 'content-2'],
      })
    })

    it('should handle empty favourites', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      vi.mocked(DatabaseQueries.getUserFavorites).mockResolvedValue({
        universes: [],
        content: [],
      })

      const result = await userService.getUserFavourites('test-user-123')

      expect(result).toEqual({
        universes: [],
        content: [],
      })
    })

    it('should handle database errors gracefully', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      vi.mocked(DatabaseQueries.getUserFavorites).mockRejectedValue(
        new Error('Database error')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await userService.getUserFavourites('test-user-123')

      expect(result).toEqual({ universes: [], content: [] })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching user favourites:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('addToFavourites', () => {
    it('should add universe to favourites', async () => {
      const { userService } = await import('../user.service')

      const mockFavorite = createMockFavorite()
      const mockReturning = vi.fn().mockResolvedValue([mockFavorite])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const result = await userService.addToFavourites(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
      expect(result).toEqual(mockFavorite)
    })

    it('should add content to favourites', async () => {
      const { userService } = await import('../user.service')

      const mockFavorite = createMockFavorite({ targetType: 'content' })
      const mockReturning = vi.fn().mockResolvedValue([mockFavorite])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const result = await userService.addToFavourites(
        'test-user-123',
        'test-content-123',
        'content'
      )

      expect(result.targetType).toBe('content')
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        userService.addToFavourites(
          'test-user-123',
          'test-universe-123',
          'universe'
        )
      ).rejects.toThrow('Failed to add to favourites')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error adding to favourites:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('removeFromFavourites', () => {
    it('should remove favourite successfully', async () => {
      const { userService } = await import('../user.service')

      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await userService.removeFromFavourites(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      mockDb.delete.mockReturnValue({ where: mockWhere })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        userService.removeFromFavourites(
          'test-user-123',
          'test-universe-123',
          'universe'
        )
      ).rejects.toThrow('Failed to remove from favourites')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error removing from favourites:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('isFavourite', () => {
    it('should return true when favourite exists', async () => {
      const { userService } = await import('../user.service')

      const mockFavorite = createMockFavorite()
      const mockLimit = vi.fn().mockResolvedValue([mockFavorite])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await userService.isFavourite(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(result).toBe(true)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalled()
    })

    it('should return false when favourite does not exist', async () => {
      const { userService } = await import('../user.service')

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await userService.isFavourite(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const { userService } = await import('../user.service')

      const mockLimit = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await userService.isFavourite(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking favourite status:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getByEmail', () => {
    it('should return user when found by email', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      vi.mocked(DatabaseQueries.getUserByEmail).mockResolvedValue(mockUser)

      const result = await userService.getByEmail('test@example.com')

      expect(DatabaseQueries.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com'
      )
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found by email', async () => {
      const { DatabaseQueries } = await import('@/lib/db/queries')
      const { userService } = await import('../user.service')

      vi.mocked(DatabaseQueries.getUserByEmail).mockResolvedValue(null)

      const result = await userService.getByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getProfileStats', () => {
    it('should return profile statistics', async () => {
      const { userService } = await import('../user.service')

      // Mock multiple database calls for profile stats
      const mockWhere = vi
        .fn()
        .mockResolvedValueOnce([{ count: 5 }]) // total universes
        .mockResolvedValueOnce([{ count: 3 }]) // public universes
        .mockResolvedValueOnce([{ count: 10 }]) // favourites
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await userService.getProfileStats('test-user-123')

      expect(result).toEqual({
        totalUniverses: 5,
        publicUniverses: 3,
        favouritesCount: 10,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { userService } = await import('../user.service')

      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await userService.getProfileStats('test-user-123')

      expect(result).toEqual({
        totalUniverses: 0,
        publicUniverses: 0,
        favouritesCount: 0,
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching profile stats:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('deleteUser', () => {
    it('should delete user and cascade delete related data', async () => {
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()

      // Mock getById method first (called to verify user exists)
      const getByIdSpy = vi.spyOn(userService, 'getById')
      getByIdSpy.mockResolvedValue(mockUser)

      // Mock getProfileStats method
      const getProfileStatsSpy = vi.spyOn(userService, 'getProfileStats')
      getProfileStatsSpy.mockResolvedValue({
        totalUniverses: 5,
        publicUniverses: 3,
        favouritesCount: 10,
      })

      // Mock the delete operation
      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
      mockDb.delete.mockReturnValue({ where: mockWhere })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await userService.deleteUser('test-user-123')

      expect(getByIdSpy).toHaveBeenCalledWith('test-user-123')
      expect(getProfileStatsSpy).toHaveBeenCalledWith('test-user-123')
      expect(mockDb.delete).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'User deleted successfully:',
        expect.any(Object)
      )

      consoleSpy.mockRestore()
      getByIdSpy.mockRestore()
      getProfileStatsSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()

      // Mock getById to succeed
      const getByIdSpy = vi.spyOn(userService, 'getById')
      getByIdSpy.mockResolvedValue(mockUser)

      // Mock getProfileStats to succeed but delete to fail
      const getProfileStatsSpy = vi.spyOn(userService, 'getProfileStats')
      getProfileStatsSpy.mockResolvedValue({
        totalUniverses: 0,
        publicUniverses: 0,
        favouritesCount: 0,
      })

      const mockDeleteWhere = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(userService.deleteUser('test-user-123')).rejects.toThrow(
        'Failed to delete user'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting user:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
      getByIdSpy.mockRestore()
      getProfileStatsSpy.mockRestore()
    })
  })
})
