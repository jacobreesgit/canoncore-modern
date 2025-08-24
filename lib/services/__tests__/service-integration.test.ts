// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Test file with mocked database functions
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Content, ContentRelationship } from '@/lib/db/schema'

// Simple mock database following existing patterns
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
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

// Mock database module
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
      mockDb.insert().values().returning.mockResolvedValueOnce([mockContent])

      // Mock relationship creation - second call returns relationship
      mockDb
        .insert()
        .values()
        .returning.mockResolvedValueOnce([mockRelationship])

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
      mockDb.delete().where.mockResolvedValue(undefined)

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
      mockDb.select().from().where().limit.mockResolvedValueOnce([mockUser])

      // Mock content creation
      mockDb.insert().values().returning.mockResolvedValueOnce([mockContent])

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
