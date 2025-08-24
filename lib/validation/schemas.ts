import { z } from 'zod'

/**
 * Common validation schemas using Zod
 */

// Base schemas
export const emailSchema = z
  .string('Email is required and must be a string')
  .email('Please enter a valid email address')
  .max(254, 'Email must be 254 characters or less')

export const passwordSchema = z
  .string('Password is required and must be a string')
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be 128 characters or less')

export const nameSchema = z
  .string('Name is required and must be a string')
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .trim()

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(500, 'URL must be 500 characters or less')
  .optional()
  .or(z.literal(''))

export const descriptionSchema = z
  .string('Description must be a string')
  .max(1000, 'Description must be 1000 characters or less')
  .optional()

// User schemas
export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string('Password is required'),
})

export const userProfileUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string('Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string('Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Universe schemas
export const universeSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.default(''),
  isPublic: z.boolean().default(false),
  sourceLink: urlSchema,
  sourceLinkName: z
    .string()
    .max(255, 'Source link name must be 255 characters or less')
    .optional(),
})

export const universeUpdateSchema = universeSchema.partial()

// Content schemas
export const contentSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.default(''),
  universeId: z.string('Universe ID is required'),
  isViewable: z.boolean().default(false),
  mediaType: z.enum(
    [
      'video',
      'audio',
      'text',
      'character',
      'location',
      'item',
      'event',
      'collection',
    ],
    'Please select a valid media type'
  ),
  sourceLink: urlSchema,
  sourceLinkName: z
    .string()
    .max(255, 'Source link name must be 255 characters or less')
    .optional(),
})

export const contentUpdateSchema = contentSchema
  .partial()
  .omit({ universeId: true })

// Progress schemas
export const progressUpdateSchema = z.object({
  progress: z
    .number('Progress is required and must be a number')
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100'),
  contentId: z.string('Content ID is required'),
})

// Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must be 100 characters or less')
    .trim(),
  type: z.enum(['universes', 'content', 'all']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(20),
})

// Contact/Feedback schemas
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z
    .string('Subject is required')
    .min(1, 'Subject is required')
    .max(100, 'Subject must be 100 characters or less'),
  message: z
    .string('Message is required')
    .min(10, 'Message must be at least 10 characters long')
    .max(1000, 'Message must be 1000 characters or less'),
})

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a file',
  }),
  type: z.enum(['image', 'video', 'audio', 'document']).optional(),
})

// Bulk operation schemas
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'At least one item must be selected')
    .max(100, 'Cannot delete more than 100 items at once'),
})

// Export types for TypeScript
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
export type Universe = z.infer<typeof universeSchema>
export type UniverseUpdate = z.infer<typeof universeUpdateSchema>
export type Content = z.infer<typeof contentSchema>
export type ContentUpdate = z.infer<typeof contentUpdateSchema>
export type ProgressUpdate = z.infer<typeof progressUpdateSchema>
export type Search = z.infer<typeof searchSchema>
export type Contact = z.infer<typeof contactSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>
export type BulkDelete = z.infer<typeof bulkDeleteSchema>
