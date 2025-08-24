import { describe, it, expect } from 'vitest'
import {
  calculateOrganisationalProgress,
  getContentProgress,
  isContentCompleted,
  formatProgressText,
  type ContentWithProgress,
} from '../progress'

describe('Progress Utils', () => {
  describe('calculateOrganisationalProgress', () => {
    it('should return 0 when no children', () => {
      const result = calculateOrganisationalProgress([])
      expect(result.percentage).toBe(0)
      expect(result.totalItems).toBe(0)
      expect(result.completedItems).toBe(0)
    })

    it('should calculate progress based on viewable children', () => {
      const children: ContentWithProgress[] = [
        { id: '1', isViewable: true, progress: 100 },
        { id: '2', isViewable: true, progress: 50 },
        { id: '3', isViewable: true, progress: 0 },
      ]
      const result = calculateOrganisationalProgress(children)
      expect(result.percentage).toBe(50) // (100 + 50 + 0) / 3 = 50
      expect(result.totalItems).toBe(3)
      expect(result.completedItems).toBe(1) // Only first child is 100% complete
    })

    it('should handle 100% completion', () => {
      const children: ContentWithProgress[] = [
        { id: '1', isViewable: true, progress: 100 },
        { id: '2', isViewable: true, progress: 100 },
      ]
      const result = calculateOrganisationalProgress(children)
      expect(result.percentage).toBe(100)
      expect(result.completedItems).toBe(2)
    })

    it('should only count viewable children', () => {
      const children: ContentWithProgress[] = [
        { id: '1', isViewable: true, progress: 100 },
        { id: '2', isViewable: false, progress: 100 }, // Should be ignored for direct calculation
        { id: '3', isViewable: true, progress: 0 },
      ]
      const result = calculateOrganisationalProgress(children)
      expect(result.percentage).toBe(50) // Only viewable: (100 + 0) / 2 = 50
      expect(result.totalItems).toBe(2)
    })
  })

  describe('getContentProgress', () => {
    it('should return progress for viewable content', () => {
      const content: ContentWithProgress = {
        id: '1',
        isViewable: true,
        progress: 75,
      }
      const result = getContentProgress(content)
      expect(result).toBe(75)
    })

    it('should return calculated progress for organisational content', () => {
      const content: ContentWithProgress = {
        id: '1',
        isViewable: false,
        calculatedProgress: 60,
      }
      const result = getContentProgress(content)
      expect(result).toBe(60)
    })

    it('should return 0 when no progress data', () => {
      const content: ContentWithProgress = {
        id: '1',
        isViewable: true,
      }
      const result = getContentProgress(content)
      expect(result).toBe(0)
    })
  })

  describe('isContentCompleted', () => {
    it('should return true for completed viewable content', () => {
      const content: ContentWithProgress = {
        id: '1',
        isViewable: true,
        progress: 100,
      }
      const result = isContentCompleted(content)
      expect(result).toBe(true)
    })

    it('should return false for incomplete viewable content', () => {
      const content: ContentWithProgress = {
        id: '1',
        isViewable: true,
        progress: 75,
      }
      const result = isContentCompleted(content)
      expect(result).toBe(false)
    })
  })

  describe('formatProgressText', () => {
    it('should format progress text correctly', () => {
      const calculation = {
        totalItems: 5,
        completedItems: 3,
        percentage: 75,
      }
      const result = formatProgressText(calculation)
      expect(result).toBe('75% complete (3/5)')
    })

    it('should handle zero items', () => {
      const calculation = {
        totalItems: 0,
        completedItems: 0,
        percentage: 0,
      }
      const result = formatProgressText(calculation)
      expect(result).toBe('0% complete')
    })
  })
})
