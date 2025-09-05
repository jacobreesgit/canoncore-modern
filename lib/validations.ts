/**
 * Shared validation schemas used across frontend and backend
 * Separated from services to avoid server-only imports in client components
 */

import { z } from 'zod'

// User validation schemas - used on both frontend and backend
export const userValidation = {
  signUp: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  }),
  signIn: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
  updateProfile: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    email: z.string().email('Invalid email address').toLowerCase().optional(),
  }),
}

// Universe validation schemas
export const universeValidation = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional().default(''),
    isPublic: z.boolean().default(false),
  }),
  update: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    isPublic: z.boolean().optional(),
  }),
}

// Collection validation schemas
export const collectionValidation = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional().default(''),
    universeId: z.string().min(1, 'Universe ID is required'),
  }),
  update: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
  }),
}

// Group validation schemas
export const groupValidation = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional().default(''),
    collectionId: z.string().min(1, 'Collection ID is required'),
    itemType: z.string().min(1, 'Item type is required').max(100, 'Item type too long'),
  }),
  update: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    itemType: z.string().min(1, 'Item type is required').max(100, 'Item type too long').optional(),
  }),
}

// Content validation schemas
export const contentValidation = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional().default(''),
    groupId: z.string().min(1, 'Group ID is required'),
    itemType: z.string().min(1, 'Item type is required').max(100, 'Item type too long'),
    isViewable: z.boolean().default(false),
    releaseDate: z.date().optional(),
  }),
  update: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    itemType: z.string().min(1, 'Item type is required').max(100, 'Item type too long').optional(),
    isViewable: z.boolean().optional(),
    releaseDate: z.date().optional(),
  }),
}