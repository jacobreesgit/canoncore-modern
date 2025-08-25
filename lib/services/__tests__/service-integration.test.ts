/**
 * Refactored to remove @ts-nocheck and implement proper TypeScript types
 * using proven database service mocking pattern from wanago.io article.
 *
 * Key changes:
 * - Removed @ts-nocheck directive for proper TypeScript support
 * - Replaced complex pre-configured mock chains with simple mockDb object
 * - Updated all tests to use explicit mock chain setup for better debugging
 * - Added comprehensive beforeEach mock chain reset for reliable test isolation
 * - Converted integration tests to use consistent mocking pattern across all service interactions
 * - Maintains all cross-service workflow testing while improving type safety
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Content, ContentRelationship } from '@/lib/db/schema'

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

// Mock server-only
vi.mock('server-only', () => ({}))

// Test data factories
const createMockUser = (): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  image: null,
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createMockContent = (): Content => ({
  id: 'content-1',
  name: 'Test Content',
  description: 'Test Description',
  universeId: 'universe-1',
  userId: 'user-1',
  isViewable: true,
  mediaType: 'video',
  sourceLink: null,
  sourceLinkName: null,
  lastAccessedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('Service Integration Tests', () => {
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

  describe('Content creation workflow', () => {
    it('should create content and allow relationship creation', async () => {
      // Import services
      const { contentService } = await import('../content.service')
      const { relationshipService } = await import('../relationship.service')

      const mockContent = createMockContent()
      const mockRelationship: ContentRelationship = {
        id: 'rel-1',
        parentId: 'content-parent',
        childId: 'content-1',
        universeId: 'universe-1',
        userId: 'user-1',
        displayOrder: null,
        contextDescription: null,
        createdAt: new Date(),
      }

      // Mock content creation - first call returns content
      const mockContentReturning = vi.fn().mockResolvedValueOnce([mockContent])
      const mockContentValues = vi
        .fn()
        .mockReturnValue({ returning: mockContentReturning })
      mockDb.insert.mockReturnValueOnce({ values: mockContentValues })

      // Mock relationship creation - second call returns relationship
      const mockRelReturning = vi.fn().mockResolvedValueOnce([mockRelationship])
      const mockRelValues = vi
        .fn()
        .mockReturnValue({ returning: mockRelReturning })
      mockDb.insert.mockReturnValueOnce({ values: mockRelValues })

      // Test content creation
      const createdContent = await contentService.create({
        name: mockContent.name,
        description: mockContent.description,
        universeId: mockContent.universeId,
        userId: mockContent.userId,
        isViewable: mockContent.isViewable,
        mediaType: mockContent.mediaType,
      })

      expect(createdContent).toEqual(mockContent)
      expect(mockDb.insert).toHaveBeenCalled()

      // Test relationship creation
      const createdRelationship = await relationshipService.create(
        'content-parent',
        mockContent.id,
        mockContent.universeId,
        mockContent.userId
      )

      expect(createdRelationship).toEqual(mockRelationship)
      expect(mockDb.insert).toHaveBeenCalled()
    })
  })

  describe('Universe deletion workflow', () => {
    it('should handle universe deletion cascade', async () => {
      const { universeService } = await import('../universe.service')

      // Mock successful deletion
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await universeService.delete('universe-1')

      expect(mockDb.delete).toHaveBeenCalled()
    })
  })

  describe('Cross-service data consistency', () => {
    it('should maintain data consistency across services', async () => {
      const { contentService } = await import('../content.service')
      const { userService } = await import('../user.service')

      const mockUser = createMockUser()
      const mockContent = createMockContent()

      // Mock user fetch
      const mockUserLimit = vi.fn().mockResolvedValueOnce([mockUser])
      const mockUserWhere = vi.fn().mockReturnValue({ limit: mockUserLimit })
      const mockUserFrom = vi.fn().mockReturnValue({ where: mockUserWhere })
      mockDb.select.mockReturnValueOnce({ from: mockUserFrom })

      // Mock content creation
      const mockContentReturning = vi.fn().mockResolvedValueOnce([mockContent])
      const mockContentValues = vi
        .fn()
        .mockReturnValue({ returning: mockContentReturning })
      mockDb.insert.mockReturnValueOnce({ values: mockContentValues })

      // Verify user exists
      const user = await userService.getById('user-1')
      expect(user).toEqual(mockUser)

      // Create content for that user
      const content = await contentService.create({
        name: mockContent.name,
        description: mockContent.description,
        universeId: mockContent.universeId,
        userId: mockUser.id,
        isViewable: mockContent.isViewable,
        mediaType: mockContent.mediaType,
      })

      expect(content?.userId).toBe(user?.id)
    })
  })
})
