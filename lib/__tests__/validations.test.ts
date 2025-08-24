import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Example validation schemas (these would be in your actual validation files)
const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const UniverseSchema = z.object({
  name: z
    .string()
    .min(1, 'Universe name is required')
    .max(255, 'Universe name too long'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  sourceLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  sourceLinkName: z.string().max(255, 'Source link name too long').optional(),
})

const ContentSchema = z.object({
  title: z
    .string()
    .min(1, 'Content title is required')
    .max(255, 'Content title too long'),
  description: z.string().optional(),
  contentType: z.enum(['viewable', 'organisational'], {
    message: 'Content type must be viewable or organisational',
  }),
  isViewable: z.boolean().default(false),
  parentId: z.string().uuid('Invalid parent ID').optional(),
})

describe('Data Validation Schemas', () => {
  describe('UserRegistrationSchema', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      }

      const result = UserRegistrationSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        displayName: 'Test User',
        password: 'password123',
      }

      const result = UserRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(
          result.error.issues.some(
            err => err.message === 'Invalid email format'
          )
        ).toBe(true)
      }
    })

    it('should reject short display name', () => {
      const invalidData = {
        email: 'test@example.com',
        displayName: 'A',
        password: 'password123',
      }

      const result = UserRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Display name must be at least 2 characters'
        )
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'short',
      }

      const result = UserRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters'
        )
      }
    })
  })

  describe('UniverseSchema', () => {
    it('should validate correct universe data', () => {
      const validData = {
        name: 'Test Universe',
        description: 'A test universe',
        isPublic: true,
        sourceLink: 'https://example.com',
        sourceLinkName: 'Example',
      }

      const result = UniverseSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should apply default isPublic value', () => {
      const dataWithoutIsPublic = {
        name: 'Test Universe',
      }

      const result = UniverseSchema.safeParse(dataWithoutIsPublic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPublic).toBe(false)
      }
    })

    it('should reject empty universe name', () => {
      const invalidData = {
        name: '',
        isPublic: false,
      }

      const result = UniverseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Universe name is required')
      }
    })

    it('should reject invalid source link URL', () => {
      const invalidData = {
        name: 'Test Universe',
        sourceLink: 'not-a-url',
        isPublic: false,
      }

      const result = UniverseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid URL')
      }
    })

    it('should allow empty string for source link', () => {
      const validData = {
        name: 'Test Universe',
        sourceLink: '',
        isPublic: false,
      }

      const result = UniverseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('ContentSchema', () => {
    it('should validate correct content data', () => {
      const validData = {
        title: 'Test Content',
        description: 'Test description',
        contentType: 'viewable' as const,
        isViewable: true,
        parentId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = ContentSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid content type', () => {
      const invalidData = {
        title: 'Test Content',
        contentType: 'invalid-type',
        isViewable: true,
      }

      const result = ContentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Content type must be viewable or organisational'
        )
      }
    })

    it('should apply default isViewable value', () => {
      const dataWithoutIsViewable = {
        title: 'Test Content',
        contentType: 'organisational' as const,
      }

      const result = ContentSchema.safeParse(dataWithoutIsViewable)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isViewable).toBe(false)
      }
    })

    it('should reject invalid UUID for parentId', () => {
      const invalidData = {
        title: 'Test Content',
        contentType: 'viewable' as const,
        parentId: 'not-a-uuid',
      }

      const result = ContentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid parent ID')
      }
    })
  })
})
