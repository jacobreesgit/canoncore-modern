/**
 * Refactored to remove @ts-nocheck and implement proper TypeScript types
 * using proven database service mocking pattern from wanago.io article.
 *
 * Key changes:
 * - Removed @ts-nocheck directive for proper TypeScript support
 * - Replaced complex inline vi.mock with simple mockDb object pattern
 * - Updated all tests to use explicit mock chain setup (e.g., mockWhere, mockFrom)
 * - Added comprehensive beforeEach mock chain reset for consistent test state
 * - Maintains all original test logic while improving type safety and maintainability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelationshipService } from '../relationship.service'
import type { ContentRelationship, Content } from '@/lib/db/schema'

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('server-only', () => ({}))

// Mock data factories
const createMockRelationship = (
  overrides: Partial<ContentRelationship> = {}
): ContentRelationship => ({
  id: 'rel-1',
  parentId: 'parent-1',
  childId: 'child-1',
  universeId: 'universe-1',
  userId: 'user-1',
  createdAt: new Date(),
  ...overrides,
})

const createMockContent = (overrides: Partial<Content> = {}): Content => ({
  id: 'content-1',
  universeId: 'universe-1',
  userId: 'user-1',
  name: 'Test Content',
  description: 'Test Description',
  itemType: 'text',
  isViewable: true,
  sourceId: null,
  sourceLink: 'https://example.com',
  sourceLinkName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('Relationship Service', () => {
  let service: RelationshipService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RelationshipService()
    // Reset mock chain implementations
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn(),
        }),
      }),
    })
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    })
    mockDb.delete.mockReturnValue({
      where: vi.fn(),
    })
  })

  describe('getByUniverse', () => {
    it('should return relationships for a universe', async () => {
      const mockRelationships = [
        { parentId: 'parent-1', childId: 'child-1' },
        { parentId: 'parent-1', childId: 'child-2' },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockRelationships)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getByUniverse('universe-1')

      expect(mockDb.select).toHaveBeenCalled()
      expect(result).toEqual(mockRelationships)
    })

    it('should return empty array when no relationships exist', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getByUniverse('universe-1')

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      await expect(service.getByUniverse('universe-1')).rejects.toThrow(
        'Failed to fetch universe relationships'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching universe relationships:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getParents', () => {
    it('should return parent relationships for content', async () => {
      const mockParents = [
        { parentId: 'parent-1', childId: 'content-1' },
        { parentId: 'parent-2', childId: 'content-1' },
      ]
      const mockWhere = vi.fn().mockResolvedValue(mockParents)
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getParents('content-1')

      expect(result).toEqual(mockParents)
    })

    it('should return empty array when no parents exist', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getParents('content-1')

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      await expect(service.getParents('content-1')).rejects.toThrow(
        'Failed to fetch content parents'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching content parents:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getChildren', () => {
    it('should return child relationships for content', async () => {
      const mockChildren = [
        { parentId: 'parent-1', childId: 'child-1' },
        { parentId: 'parent-1', childId: 'child-2' },
      ]
      const mockOrderBy = vi.fn().mockResolvedValue(mockChildren)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getChildren('parent-1')

      expect(result).toEqual(mockChildren)
    })

    it('should return empty array when no children exist', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      const result = await service.getChildren('parent-1')

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      await expect(service.getChildren('parent-1')).rejects.toThrow(
        'Failed to fetch content children'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching content children:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('create', () => {
    it('should create a new relationship successfully', async () => {
      // Mock getChildren call that happens inside create
      vi.spyOn(service, 'getChildren').mockResolvedValue([])

      const mockCreatedRelationship = createMockRelationship({
        parentId: 'parent-1',
        childId: 'child-1',
        universeId: 'universe-1',
        userId: 'user-1',
      })
      const mockReturning = vi.fn().mockResolvedValue([mockCreatedRelationship])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      const result = await service.create(
        'parent-1',
        'child-1',
        'universe-1',
        'user-1'
      )

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedRelationship)
    })

    it('should handle database errors during creation', async () => {
      // Mock getChildren call that happens inside create
      vi.spyOn(service, 'getChildren').mockResolvedValue([])

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockReturning = vi
        .fn()
        .mockRejectedValue(new Error('Insert failed'))
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      await expect(
        service.create('parent-1', 'child-1', 'universe-1', 'user-1')
      ).rejects.toThrow('Failed to create relationship')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating relationship:',
        new Error('Insert failed')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('delete', () => {
    it('should delete a relationship successfully', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await service.delete('parent-1', 'child-1')

      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should handle database errors during deletion', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockWhere = vi.fn().mockRejectedValue(new Error('Delete failed'))
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await expect(service.delete('parent-1', 'child-1')).rejects.toThrow(
        'Failed to delete relationship'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting relationship:',
        new Error('Delete failed')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteAllForContent', () => {
    it('should delete all relationships for content successfully', async () => {
      const mockDelete = vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
      mockDb.delete = mockDelete

      await service.deleteAllForContent('content-1')

      expect(mockDelete).toHaveBeenCalledTimes(2) // Once for parent, once for child
    })

    it('should handle database errors during deletion', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockWhere = vi.fn().mockRejectedValue(new Error('Delete failed'))
      mockDb.delete.mockReturnValue({ where: mockWhere })

      await expect(service.deleteAllForContent('content-1')).rejects.toThrow(
        'Failed to delete content relationships'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting content relationships:',
        new Error('Delete failed')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('buildHierarchyTree', () => {
    it('should build a simple parent-child tree', () => {
      const content = [
        createMockContent({ id: 'parent-1', name: 'Parent' }),
        createMockContent({ id: 'child-1', name: 'Child 1' }),
        createMockContent({ id: 'child-2', name: 'Child 2' }),
      ]
      const relationships = [
        { parentId: null, childId: 'parent-1' }, // Make parent-1 a root node
        { parentId: 'parent-1', childId: 'child-1' },
        { parentId: 'parent-1', childId: 'child-2' },
      ]

      const tree = service.buildHierarchyTree(content, relationships)

      expect(tree).toHaveLength(1)
      expect(tree[0].id).toBe('parent-1')
      expect(tree[0].children).toHaveLength(2)
      expect(tree[0].children[0].id).toBe('child-1')
      expect(tree[0].children[1].id).toBe('child-2')
    })

    it('should build a multi-level hierarchy', () => {
      const content = [
        createMockContent({ id: 'root', name: 'Root' }),
        createMockContent({ id: 'level1', name: 'Level 1' }),
        createMockContent({ id: 'level2', name: 'Level 2' }),
      ]
      const relationships = [
        { parentId: null, childId: 'root' }, // Make root a root node
        { parentId: 'root', childId: 'level1' },
        { parentId: 'level1', childId: 'level2' },
      ]

      const tree = service.buildHierarchyTree(content, relationships)

      expect(tree).toHaveLength(1)
      expect(tree[0].id).toBe('root')
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].id).toBe('level1')
      expect(tree[0].children[0].children).toHaveLength(1)
      expect(tree[0].children[0].children[0].id).toBe('level2')
    })

    it('should handle multiple root nodes', () => {
      const content = [
        createMockContent({ id: 'root1', name: 'Root 1' }),
        createMockContent({ id: 'root2', name: 'Root 2' }),
        createMockContent({ id: 'child1', name: 'Child 1' }),
        createMockContent({ id: 'child2', name: 'Child 2' }),
      ]
      const relationships = [
        { parentId: null, childId: 'root1' }, // Make root1 a root node
        { parentId: null, childId: 'root2' }, // Make root2 a root node
        { parentId: 'root1', childId: 'child1' },
        { parentId: 'root2', childId: 'child2' },
      ]

      const tree = service.buildHierarchyTree(content, relationships)

      expect(tree).toHaveLength(2)
      expect(tree.map(node => node.id)).toContain('root1')
      expect(tree.map(node => node.id)).toContain('root2')
    })

    it('should handle orphaned nodes (no parents)', () => {
      const content = [
        createMockContent({ id: 'orphan1', name: 'Orphan 1' }),
        createMockContent({ id: 'orphan2', name: 'Orphan 2' }),
      ]
      const relationships: Array<{
        parentId: string | null
        childId: string
      }> = [
        { parentId: null, childId: 'orphan1' }, // Orphan as root
        { parentId: null, childId: 'orphan2' }, // Orphan as root
      ]

      const tree = service.buildHierarchyTree(content, relationships)

      expect(tree).toHaveLength(2)
      expect(tree[0].children).toHaveLength(0)
      expect(tree[1].children).toHaveLength(0)
    })

    it('should handle empty content and relationships', () => {
      const tree = service.buildHierarchyTree([], [])

      expect(tree).toHaveLength(0)
    })
  })

  describe('getUniverseHierarchy', () => {
    it('should return hierarchy for universe', async () => {
      const mockContent = [
        createMockContent({ id: 'parent-1', name: 'Parent' }),
        createMockContent({ id: 'child-1', name: 'Child' }),
      ]
      const mockRelationships = [
        { parentId: null, childId: 'parent-1' },
        { parentId: 'parent-1', childId: 'child-1' },
      ]

      const mockWhere = vi.fn().mockResolvedValueOnce(mockContent)
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })
      vi.spyOn(service, 'getByUniverse').mockResolvedValueOnce(
        mockRelationships
      )

      const result = await service.getUniverseHierarchy('universe-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('parent-1')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].id).toBe('child-1')
    })

    it('should handle empty universe', async () => {
      const mockWhere = vi.fn().mockResolvedValueOnce([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })
      vi.spyOn(service, 'getByUniverse').mockResolvedValueOnce([])

      const result = await service.getUniverseHierarchy('universe-1')

      expect(result).toHaveLength(0)
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const mockWhere = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      await expect(service.getUniverseHierarchy('universe-1')).rejects.toThrow(
        'Failed to build universe hierarchy'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error building universe hierarchy:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('wouldCreateCircularDependency', () => {
    it('should detect self-referential relationship', async () => {
      const result = await service.wouldCreateCircularDependency(
        'content-1',
        'content-1'
      )

      expect(result).toBe(true)
    })

    it('should detect circular dependency through ancestors', async () => {
      // Mock getParents to simulate: child -> parent -> grandparent
      vi.spyOn(service, 'getParents')
        .mockResolvedValueOnce([{ parentId: 'grandparent', childId: 'parent' }]) // parent's parents
        .mockResolvedValueOnce([]) // grandparent's parents (none)

      const result = await service.wouldCreateCircularDependency(
        'parent',
        'grandparent'
      )

      expect(result).toBe(true)
    })

    it('should allow valid relationship creation', async () => {
      vi.spyOn(service, 'getParents').mockResolvedValueOnce([]) // parent has no parents

      const result = await service.wouldCreateCircularDependency(
        'parent',
        'child'
      )

      expect(result).toBe(false)
    })

    it('should handle complex hierarchy without circular dependency', async () => {
      // Mock a complex hierarchy: A -> B -> C, adding D -> B should be OK
      vi.spyOn(service, 'getParents')
        .mockResolvedValueOnce([{ parentId: 'A', childId: 'B' }]) // B's parent is A
        .mockResolvedValueOnce([]) // A has no parents

      const result = await service.wouldCreateCircularDependency('D', 'B')

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      // Force an error in the isAncestor method by making getParents fail
      vi.spyOn(service, 'getParents').mockRejectedValue(
        new Error('Database error')
      )

      const result = await service.wouldCreateCircularDependency(
        'parent',
        'child'
      )

      // isAncestor handles its own errors and returns false, so this should return false
      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking ancestor relationship:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getContentPath', () => {
    it('should return path from root to content', async () => {
      // Mock path: root -> level1 -> level2 -> target
      vi.spyOn(service, 'getParents')
        .mockResolvedValueOnce([{ parentId: 'level2', childId: 'target' }]) // target's parent
        .mockResolvedValueOnce([{ parentId: 'level1', childId: 'level2' }]) // level2's parent
        .mockResolvedValueOnce([{ parentId: 'root', childId: 'level1' }]) // level1's parent
        .mockResolvedValueOnce([]) // root has no parent

      const path = await service.getContentPath('target')

      expect(path).toEqual(['root', 'level1', 'level2', 'target'])
    })

    it('should return single item path for root content', async () => {
      vi.spyOn(service, 'getParents').mockResolvedValueOnce([])

      const path = await service.getContentPath('root')

      expect(path).toEqual(['root'])
    })

    it('should handle content with multiple parents by taking first', async () => {
      vi.spyOn(service, 'getParents')
        .mockResolvedValueOnce([
          { parentId: 'parent1', childId: 'child' },
          { parentId: 'parent2', childId: 'child' },
        ]) // child has multiple parents
        .mockResolvedValueOnce([]) // parent1 has no parent

      const path = await service.getContentPath('child')

      expect(path).toEqual(['parent1', 'child'])
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.spyOn(service, 'getParents').mockRejectedValue(
        new Error('Database error')
      )

      const path = await service.getContentPath('content-1')

      expect(path).toEqual(['content-1']) // Should return at least the target content
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting content path:',
        new Error('Database error')
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('integration scenarios', () => {
    it('should handle creating and querying relationships', async () => {
      const mockRelationship = createMockRelationship({
        parentId: 'parent-1',
        childId: 'child-1',
        universeId: 'universe-1',
        userId: 'user-1',
      })

      // Mock creation
      const mockReturning = vi.fn().mockResolvedValueOnce([mockRelationship])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      mockDb.insert.mockReturnValue({ values: mockValues })

      // Create relationship
      const created = await service.create(
        'parent-1',
        'child-1',
        'universe-1',
        'user-1'
      )
      expect(created).toEqual(mockRelationship)

      // Mock query for getChildren - setup new mock chain for the query
      const mockChildrenResult = [{ parentId: 'parent-1', childId: 'child-1' }]
      const mockOrderBy = vi.fn().mockResolvedValue(mockChildrenResult)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockDb.select.mockReturnValue({ from: mockFrom })

      // Query it back
      const children = await service.getChildren('parent-1')
      expect(children).toHaveLength(1)
      expect(children[0].childId).toBe('child-1')
    })

    it('should handle complex hierarchy building and circular detection', async () => {
      const mockContent = [
        createMockContent({ id: 'A', name: 'A' }),
        createMockContent({ id: 'B', name: 'B' }),
        createMockContent({ id: 'C', name: 'C' }),
      ]
      const mockRelationships = [
        { parentId: null, childId: 'A' },
        { parentId: 'A', childId: 'B' },
        { parentId: 'B', childId: 'C' },
      ]

      // Build hierarchy
      const tree = service.buildHierarchyTree(mockContent, mockRelationships)
      expect(tree[0].id).toBe('A')
      expect(tree[0].children[0].children[0].id).toBe('C')

      // Test circular detection - C -> A would create a cycle
      vi.spyOn(service, 'getParents')
        .mockResolvedValueOnce([{ parentId: 'B', childId: 'C' }]) // C's parent is B
        .mockResolvedValueOnce([{ parentId: 'A', childId: 'B' }]) // B's parent is A
        .mockResolvedValueOnce([]) // A has no parent

      const wouldBeCircular = await service.wouldCreateCircularDependency(
        'C',
        'A'
      )
      expect(wouldBeCircular).toBe(true)
    })
  })
})
