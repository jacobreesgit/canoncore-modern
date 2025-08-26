import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Content, NewContent } from '@/lib/db/schema'

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
    it('should return content when found', async () => {
      const mockContent = createMockContent({ id: 'content-123' })
      const mockLimit = vi.fn().mockResolvedValue([mockContent])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.getById('content-123')

      expect(result).toEqual(mockContent)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalled()
    })

    it('should return null when content not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.getById('nonexistent-content')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockLimit = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockReturning = vi.fn().mockResolvedValue([createdContent])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const result = await contentService.create(newContent)

      expect(result).toEqual(createdContent)
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
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
      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

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
      const mockReturning = vi.fn().mockResolvedValue([updatedContent])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await contentService.update('content-123', updates)

      expect(result).toEqual(updatedContent)
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockReturning).toHaveBeenCalled()
    })

    it('should return null when content not found for update', async () => {
      const mockReturning = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

      const result = await contentService.update('nonexistent-content', {
        name: 'New Name',
      })

      expect(result).toBeNull()
    })

    it('should handle update errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.update.mockReturnValue({ set: mockSet })

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
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await contentService.delete('content-123')

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      mockDb.delete.mockReturnValue({ where: mockWhere })

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
      const mockOrderBy = vi.fn().mockResolvedValue(mockContent)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.getByUniverse('universe-123')

      expect(result).toEqual(mockContent)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockOrderBy).toHaveBeenCalled()
    })

    it('should return empty array when no content found', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.getByUniverse('universe-123')

      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockOrderBy = vi.fn().mockResolvedValue(mockContent)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.getViewableByUniverse('universe-123')

      expect(result).toEqual(mockContent)
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockOrderBy = vi.fn().mockResolvedValue(mockContent)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result =
        await contentService.getOrganisationalByUniverse('universe-123')

      expect(result).toEqual(mockContent)
    })

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockOrderBy = vi.fn().mockResolvedValue(mockContent)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await contentService.searchInUniverse(
        'universe-123',
        'Searched'
      )

      expect(result).toEqual(mockContent)
    })

    it('should return empty results for no matches', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Search error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

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
})
