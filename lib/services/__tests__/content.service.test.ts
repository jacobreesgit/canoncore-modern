// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Test file with mocked database functions
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Content, NewContent } from '@/lib/db/schema'

// Mock the database module with inline implementation
vi.mock('@/lib/db', () => ({
  db: {
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
          orderBy: vi.fn(),
        }),
        orderBy: vi.fn(),
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn(),
    }),
  },
}))

// Import db after mocking
import { db as mockDb } from '@/lib/db'

// Mock other dependencies with comprehensive implementations
vi.mock('@/lib/db/optimized-queries', () => ({
  OptimizedQueries: {
    getContentByUniverse: vi.fn(),
    getContentById: vi.fn(),
    searchContent: vi.fn(),
  },
}))

vi.mock('server-only', () => ({}))

import { contentService } from '../content.service'

// Test data factories
const createMockContent = (overrides: Partial<Content> = {}): Content => ({
  id: 'test-content-123',
  name: 'Test Content',
  description: 'Test content description',
  universeId: 'test-universe-123',
  userId: 'test-user-123',
  isViewable: true,
  mediaType: 'video',
  sourceLink: 'https://example.com/content',
  sourceLinkName: 'Example Source',
  lastAccessedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('Content Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getById', () => {
    it('should return content when found', async () => {
      const mockContent = createMockContent({ id: 'content-123' })
      mockDb.select().from().where().limit.mockResolvedValue([mockContent])

      const result = await contentService.getById('content-123')

      expect(result).toEqual(mockContent)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should return null when content not found', async () => {
      mockDb.select().from().where().limit.mockResolvedValue([])

      const result = await contentService.getById('nonexistent-content')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .limit.mockRejectedValue(new Error('Database error'))

      await expect(contentService.getById('content-123')).rejects.toThrow(
        'Failed to fetch content'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('create', () => {
    it('should create content successfully', async () => {
      const newContent: NewContent = {
        name: 'New Content',
        description: 'New content description',
        universeId: 'universe-123',
        userId: 'user-123',
        isViewable: true,
        mediaType: 'video',
      }
      const createdContent = createMockContent(newContent)
      mockDb.insert().values().returning.mockResolvedValue([createdContent])

      const result = await contentService.create(newContent)

      expect(result).toEqual(createdContent)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should handle creation errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const newContent: NewContent = {
        name: 'New Content',
        description: 'New content description',
        universeId: 'universe-123',
        userId: 'user-123',
        isViewable: true,
        mediaType: 'video',
      }
      mockDb
        .insert()
        .values()
        .returning.mockRejectedValue(new Error('Database error'))

      await expect(contentService.create(newContent)).rejects.toThrow(
        'Failed to create content'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('update', () => {
    it('should update content successfully', async () => {
      const updates = { name: 'Updated Content' }
      const updatedContent = createMockContent({
        id: 'content-123',
        ...updates,
      })
      mockDb
        .update()
        .set()
        .where()
        .returning.mockResolvedValue([updatedContent])

      const result = await contentService.update('content-123', updates)

      expect(result).toEqual(updatedContent)
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should return null when content not found for update', async () => {
      mockDb.update().set().where().returning.mockResolvedValue([])

      const result = await contentService.update('nonexistent-content', {
        name: 'New Name',
      })

      expect(result).toBeNull()
    })

    it('should handle update errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .update()
        .set()
        .where()
        .returning.mockRejectedValue(new Error('Database error'))

      await expect(
        contentService.update('content-123', { name: 'New Name' })
      ).rejects.toThrow('Failed to update content')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('delete', () => {
    it('should delete content successfully', async () => {
      mockDb.delete().where.mockResolvedValue(undefined)

      await contentService.delete('content-123')

      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb.delete().where.mockRejectedValue(new Error('Database error'))

      await expect(contentService.delete('content-123')).rejects.toThrow(
        'Failed to delete content'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getByUniverse', () => {
    it('should return content for universe', async () => {
      const mockContent = [createMockContent({ universeId: 'universe-123' })]
      mockDb.select().from().where().orderBy.mockResolvedValue(mockContent)

      const result = await contentService.getByUniverse('universe-123')

      expect(result).toEqual(mockContent)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should return empty array when no content found', async () => {
      mockDb.select().from().where().orderBy.mockResolvedValue([])

      const result = await contentService.getByUniverse('universe-123')

      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .orderBy.mockRejectedValue(new Error('Database error'))

      await expect(
        contentService.getByUniverse('universe-123')
      ).rejects.toThrow('Failed to fetch universe content')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching universe content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getViewableByUniverse', () => {
    it('should return only viewable content', async () => {
      const mockContent = [createMockContent({ isViewable: true })]
      mockDb.select().from().where().orderBy.mockResolvedValue(mockContent)

      const result = await contentService.getViewableByUniverse('universe-123')

      expect(result).toEqual(mockContent)
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .orderBy.mockRejectedValue(new Error('Database error'))

      await expect(
        contentService.getViewableByUniverse('universe-123')
      ).rejects.toThrow('Failed to fetch viewable content')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching viewable content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getOrganisationalByUniverse', () => {
    it('should return only organisational content', async () => {
      const mockContent = [createMockContent({ isViewable: false })]
      mockDb.select().from().where().orderBy.mockResolvedValue(mockContent)

      const result =
        await contentService.getOrganisationalByUniverse('universe-123')

      expect(result).toEqual(mockContent)
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .orderBy.mockRejectedValue(new Error('Database error'))

      await expect(
        contentService.getOrganisationalByUniverse('universe-123')
      ).rejects.toThrow('Failed to fetch organisational content')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching organisational content:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('searchInUniverse', () => {
    it('should search content by name', async () => {
      const mockContent = [createMockContent({ name: 'Searched Content' })]
      mockDb.select().from().where().orderBy.mockResolvedValue(mockContent)

      const result = await contentService.searchInUniverse(
        'universe-123',
        'Searched'
      )

      expect(result).toEqual(mockContent)
    })

    it('should return empty results for no matches', async () => {
      mockDb.select().from().where().orderBy.mockResolvedValue([])

      const result = await contentService.searchInUniverse(
        'universe-123',
        'No Match'
      )

      expect(result).toEqual([])
    })

    it('should handle search errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .orderBy.mockRejectedValue(new Error('Search error'))

      await expect(
        contentService.searchInUniverse('universe-123', 'query')
      ).rejects.toThrow('Failed to search content')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error searching content:',
        new Error('Search error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getByMediaType', () => {
    it('should filter content by media type', async () => {
      const mockContent = [createMockContent({ mediaType: 'video' })]
      mockDb.select().from().where().orderBy.mockResolvedValue(mockContent)

      const result = await contentService.getByMediaType(
        'universe-123',
        'video'
      )

      expect(result).toEqual(mockContent)
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockDb
        .select()
        .from()
        .where()
        .orderBy.mockRejectedValue(new Error('Database error'))

      await expect(
        contentService.getByMediaType('universe-123', 'video')
      ).rejects.toThrow('Failed to fetch content by media type')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching content by media type:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })
})
