import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, NewUser, Favorite } from '@/lib/db/schema'

// Create mock database using Drizzle's mock driver
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
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
}

// Mock the database module completely
vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Mock other dependencies with more realistic implementations
vi.mock('@/lib/db/optimized-queries', () => ({
  OptimizedQueries: {
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserFavourites: vi.fn(),
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
  })

  describe('getById', () => {
    it('should return user when found', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { withPerformanceMonitoring } = await import(
        '@/lib/db/connection-pool'
      )
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      vi.mocked(OptimizedQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(withPerformanceMonitoring).mockImplementation(fn => fn)

      const result = await userService.getById('test-user-123')

      expect(withPerformanceMonitoring).toHaveBeenCalledWith(
        OptimizedQueries.getUserById,
        'user.getById'
      )
      expect(OptimizedQueries.getUserById).toHaveBeenCalledWith('test-user-123')
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      vi.mocked(OptimizedQueries.getUserById).mockResolvedValue(null)

      const result = await userService.getById('non-existent-user')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create user with timestamps', async () => {
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      mockDb.insert().values().returning.mockResolvedValue([mockUser])

      const userData: NewUser = {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      }

      const result = await userService.create(userData)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .insert()
        .values()
        .returning.mockRejectedValue(new Error('Database error'))

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
      mockDb.update().set().where().returning.mockResolvedValue([updatedUser])

      const result = await userService.updateProfile('test-user-123', {
        name: 'Updated User',
      })

      expect(mockDb.update).toHaveBeenCalled()
      expect(result).toEqual(updatedUser)
    })

    it('should return null when user not found', async () => {
      const { userService } = await import('../user.service')

      mockDb.update().set().where().returning.mockResolvedValue([])

      const result = await userService.updateProfile('non-existent-user', {
        name: 'Updated User',
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .update()
        .set()
        .where()
        .returning.mockRejectedValue(new Error('Database error'))

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
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      const mockFavorites = [
        createMockFavorite({ targetId: 'universe-1', targetType: 'universe' }),
        createMockFavorite({ targetId: 'universe-2', targetType: 'universe' }),
        createMockFavorite({ targetId: 'content-1', targetType: 'content' }),
        createMockFavorite({ targetId: 'content-2', targetType: 'content' }),
      ]

      vi.mocked(OptimizedQueries.getUserFavourites).mockResolvedValue(
        mockFavorites
      )

      const result = await userService.getUserFavourites('test-user-123')

      expect(result).toEqual({
        universes: ['universe-1', 'universe-2'],
        content: ['content-1', 'content-2'],
      })
    })

    it('should handle empty favourites', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      vi.mocked(OptimizedQueries.getUserFavourites).mockResolvedValue([])

      const result = await userService.getUserFavourites('test-user-123')

      expect(result).toEqual({
        universes: [],
        content: [],
      })
    })

    it('should handle database errors gracefully', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      vi.mocked(OptimizedQueries.getUserFavourites).mockRejectedValue(
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
      mockDb.insert().values().returning.mockResolvedValue([mockFavorite])

      const result = await userService.addToFavourites(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result).toEqual(mockFavorite)
    })

    it('should add content to favourites', async () => {
      const { userService } = await import('../user.service')

      const mockFavorite = createMockFavorite({ targetType: 'content' })
      mockDb.insert().values().returning.mockResolvedValue([mockFavorite])

      const result = await userService.addToFavourites(
        'test-user-123',
        'test-content-123',
        'content'
      )

      expect(result.targetType).toBe('content')
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .insert()
        .values()
        .returning.mockRejectedValue(new Error('Database error'))

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

      mockDb.delete().where.mockResolvedValue(undefined)

      await userService.removeFromFavourites(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.delete().where).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { userService } = await import('../user.service')

      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

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
      mockDb.select().from().where().limit.mockResolvedValue([mockFavorite])

      const result = await userService.isFavourite(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(result).toBe(true)
    })

    it('should return false when favourite does not exist', async () => {
      const { userService } = await import('../user.service')

      mockDb.select().from().where().limit.mockResolvedValue([])

      const result = await userService.isFavourite(
        'test-user-123',
        'test-universe-123',
        'universe'
      )

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .select()
        .from()
        .where()
        .limit.mockRejectedValue(new Error('Database error'))

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
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      vi.mocked(OptimizedQueries.getUserByEmail).mockResolvedValue(mockUser)

      const result = await userService.getByEmail('test@example.com')

      expect(OptimizedQueries.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com'
      )
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found by email', async () => {
      const { OptimizedQueries } = await import('@/lib/db/optimized-queries')
      const { userService } = await import('../user.service')

      vi.mocked(OptimizedQueries.getUserByEmail).mockResolvedValue(null)

      const result = await userService.getByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getProfileStats', () => {
    it('should return profile statistics', async () => {
      const { userService } = await import('../user.service')

      // Mock multiple database calls for profile stats
      mockDb
        .select()
        .from()
        .where.mockResolvedValueOnce([{ count: 5 }]) // total universes
        .mockResolvedValueOnce([{ count: 3 }]) // public universes
        .mockResolvedValueOnce([{ count: 10 }]) // favourites

      const result = await userService.getProfileStats('test-user-123')

      expect(result).toEqual({
        totalUniverses: 5,
        publicUniverses: 3,
        favouritesCount: 10,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .select()
        .from()
        .where.mockRejectedValue(new Error('Database error'))

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

  describe('getPublicUniversesCount', () => {
    it('should return count of public universes', async () => {
      const { userService } = await import('../user.service')

      const mockResult = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]
      mockDb.select().from().where.mockResolvedValue(mockResult)

      const result = await userService.getPublicUniversesCount('test-user-123')

      expect(result).toBe(3)
    })

    it('should handle empty results', async () => {
      const { userService } = await import('../user.service')

      mockDb.select().from().where.mockResolvedValue([])

      const result = await userService.getPublicUniversesCount('test-user-123')

      expect(result).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      const { userService } = await import('../user.service')

      mockDb
        .select()
        .from()
        .where.mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await userService.getPublicUniversesCount('test-user-123')

      expect(result).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching public universes count:',
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
      mockDb.delete().where.mockResolvedValue({ rowCount: 1 })

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

      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

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
