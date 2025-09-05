import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { userValidation } from '@/lib/validations'

// Consistent error types
export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'USER_EXISTS' | 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'UserServiceError'
  }
}

// Service result type for consistent responses
export type ServiceResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  code: UserServiceError['code']
}

export class UserService {
  /**
   * Create a new user account
   * Consistent validation and error handling
   */
  static async create(input: z.infer<typeof userValidation.signUp>): Promise<ServiceResult<{ id: string; name: string; email: string }>> {
    try {
      // Validate input using shared schema
      const validatedData = userValidation.signUp.parse(input)
      const { name, email, password } = validatedData

      // Check if user already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        }
      }

      // Hash password with consistent salt rounds
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name: name.trim(),
          email,
          passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        })

      return {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name || '',
          email: newUser.email,
        }
      }
    } catch (error) {
      console.error('UserService.create error:', error)

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      }

      if (error instanceof Error && error.message.includes('unique constraint')) {
        return {
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        }
      }

      return {
        success: false,
        error: 'Failed to create user account',
        code: 'DATABASE_ERROR'
      }
    }
  }

  /**
   * Authenticate user credentials
   * Used by NextAuth.js authorize function
   */
  static async authenticate(input: z.infer<typeof userValidation.signIn>): Promise<ServiceResult<{ id: string; name: string; email: string; image: string | null }>> {
    try {
      // Validate input using shared schema
      const validatedData = userValidation.signIn.parse(input)
      const { email, password } = validatedData

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user || !user.passwordHash) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      }

      return {
        success: true,
        data: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          image: user.image,
        }
      }
    } catch (error) {
      console.error('UserService.authenticate error:', error)

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      }

      return {
        success: false,
        error: 'Authentication failed',
        code: 'DATABASE_ERROR'
      }
    }
  }

  /**
   * Find user by ID
   * Consistent user retrieval
   */
  static async findById(id: string): Promise<ServiceResult<{ id: string; name: string; email: string; image: string | null }>> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      return {
        success: true,
        data: {
          ...user,
          name: user.name || ''
        }
      }
    } catch (error) {
      console.error('UserService.findById error:', error)
      return {
        success: false,
        error: 'Failed to find user',
        code: 'DATABASE_ERROR'
      }
    }
  }

  /**
   * Find user by email
   * Consistent user retrieval
   */
  static async findByEmail(email: string): Promise<ServiceResult<{ id: string; name: string; email: string; image: string | null }>> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1)

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      return {
        success: true,
        data: {
          ...user,
          name: user.name || ''
        }
      }
    } catch (error) {
      console.error('UserService.findByEmail error:', error)
      return {
        success: false,
        error: 'Failed to find user',
        code: 'DATABASE_ERROR'
      }
    }
  }

  /**
   * Update user profile
   * Consistent profile updates
   */
  static async updateProfile(
    id: string, 
    input: z.infer<typeof userValidation.updateProfile>
  ): Promise<ServiceResult<{ id: string; name: string; email: string; image: string | null }>> {
    try {
      // Validate input using shared schema
      const validatedData = userValidation.updateProfile.parse(input)

      // Check if user exists
      const existingUser = await this.findById(id)
      if (!existingUser.success) {
        return existingUser
      }

      // If email is being updated, check for conflicts
      if (validatedData.email && validatedData.email !== existingUser.data.email) {
        const emailCheck = await this.findByEmail(validatedData.email)
        if (emailCheck.success) {
          return {
            success: false,
            error: 'Email address is already in use',
            code: 'USER_EXISTS'
          }
        }
      }

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })

      return {
        success: true,
        data: {
          ...updatedUser,
          name: updatedUser.name || ''
        }
      }
    } catch (error) {
      console.error('UserService.updateProfile error:', error)

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      }

      return {
        success: false,
        error: 'Failed to update profile',
        code: 'DATABASE_ERROR'
      }
    }
  }
}