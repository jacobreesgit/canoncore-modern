/**
 * Shared types for client and server components
 *
 * This file contains type definitions that can be safely imported
 * by both client and server components without causing build issues.
 * These types are inferred from the database schema but don't import
 * server-only modules.
 */

// User types
export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  passwordHash: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface NewUser {
  email: string
  name?: string | null
  emailVerified?: Date | null
  image?: string | null
  passwordHash?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

// Universe types
export interface Universe {
  id: string
  name: string
  description: string
  userId: string
  isPublic: boolean
  sourceLink: string | null
  sourceLinkName: string | null
  createdAt: Date
  updatedAt: Date
}

export interface NewUniverse {
  name: string
  description: string
  userId: string
  isPublic?: boolean
  sourceLink?: string | null
  sourceLinkName?: string | null
  createdAt?: Date
  updatedAt?: Date
}

// Content types
export interface Content {
  id: string
  name: string
  description: string
  universeId: string
  userId: string
  isViewable: boolean
  mediaType: string
  sourceLink: string | null
  sourceLinkName: string | null
  lastAccessedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewContent {
  name: string
  description: string
  universeId: string
  userId: string
  isViewable?: boolean
  mediaType: string
  sourceLink?: string | null
  sourceLinkName?: string | null
  lastAccessedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

// User Progress types
export interface UserProgress {
  userId: string
  contentId: string
  universeId: string
  progress: number
  updatedAt: Date
}

export interface NewUserProgress {
  userId: string
  contentId: string
  universeId: string
  progress: number
  updatedAt?: Date
}

// Content Relationships types
export interface ContentRelationship {
  id: string
  parentId: string
  childId: string
  universeId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface NewContentRelationship {
  parentId: string
  childId: string
  universeId: string
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

// Favorites types
export interface Favorite {
  id: string
  userId: string
  targetId: string
  targetType: 'universe' | 'content'
  createdAt: Date
}

export interface NewFavorite {
  userId: string
  targetId: string
  targetType: 'universe' | 'content'
  createdAt?: Date
}

// Extended types with relationships
export interface ContentWithProgress extends Content {
  progress?: number
}

export interface UniverseWithProgress extends Universe {
  progress?: number
}

// Form validation types
export interface UserRegistrationData {
  email: string
  displayName: string
  password: string
}

export interface UniverseFormData {
  name: string
  description?: string
  isPublic?: boolean
  sourceLink?: string
  sourceLinkName?: string
}

export interface ContentFormData {
  title: string
  description?: string
  contentType: 'viewable' | 'organisational'
  isViewable?: boolean
  parentId?: string
}
