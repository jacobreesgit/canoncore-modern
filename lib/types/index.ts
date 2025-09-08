/**
 * Shared TypeScript types for consistent frontend/backend data models
 * Following Context7 best practices for type safety
 */

import { z } from 'zod'
import { userValidation } from '@/lib/validations'

// Database entity types (inferred from schema)
export type User = {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export type Universe = {
  id: string
  name: string
  description: string
  userId: string
  isPublic: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export type Collection = {
  id: string
  name: string
  description: string
  universeId: string
  userId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type Group = {
  id: string
  name: string
  description: string
  collectionId: string
  userId: string
  itemType: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type Content = {
  id: string
  name: string
  description: string
  groupId: string
  userId: string
  isViewable: boolean
  itemType: string
  releaseDate: Date | null
  order: number
  createdAt: Date
  updatedAt: Date
}

// API request/response types
export type UserSignUpRequest = z.infer<typeof userValidation.signUp>
export type UserSignInRequest = z.infer<typeof userValidation.signIn>
export type UserUpdateRequest = z.infer<typeof userValidation.updateProfile>

export type UserResponse = {
  id: string
  name: string
  email: string
  image: string | null
}

export type AuthSession = {
  user: UserResponse
  expires: string
}

// Form state types for consistent component interfaces
export type SignUpFormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type SignInFormData = {
  email: string
  password: string
}

// Component prop types for consistency
export type FormFieldProps = {
  label: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export type InputFieldProps = FormFieldProps & {
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export type ButtonProps = {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

// Tree component types for hierarchical data
export type TreeNode = {
  id: string
  name: string
  type: 'universe' | 'collection' | 'group' | 'content'
  children?: TreeNode[]
  parent?: string
  order: number
  metadata?: Record<string, unknown>
}

export type HierarchyData = {
  collections: Array<{
    id: string
    name: string
    description: string
    order: number
    universeId: string
  }>
  groups: Array<{
    id: string
    name: string
    description: string
    order: number
    collectionId: string
    itemType: string
  }>
  content: Array<{
    id: string
    name: string
    description: string
    order: number
    groupId: string
    isViewable: boolean
    itemType: string
    releaseDate: Date | null
  }>
  groupRelationships: Array<{
    id: string
    parentGroupId: string
    childGroupId: string
  }>
  contentRelationships: Array<{
    id: string
    parentContentId: string
    childContentId: string
  }>
}

// Action result types for consistent server actions
export type ActionResult<T = void> =
  | {
      success: true
      data: T
      message?: string
    }
  | {
      success: false
      error: string
      code: string
    }

// Search and filter types
export type SearchFilters = {
  query?: string
  type?: 'universe' | 'collection' | 'group' | 'content'
  isPublic?: boolean
  userId?: string
}

export type SortOptions = {
  field: string
  direction: 'asc' | 'desc'
}

export type PaginationOptions = {
  page: number
  limit: number
}

// Navigation types
export type NavItem = {
  title: string
  href: string
  icon?: React.ComponentType
  active?: boolean
  children?: NavItem[]
}

export type BreadcrumbItem = {
  title: string
  href?: string
  active?: boolean
}

// Modal and dialog types
export type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
}

export type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>

// Export common schema types for reuse
export { userValidation } from '@/lib/validations'
