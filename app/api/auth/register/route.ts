import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { signIn } from '@/lib/auth'

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const { email, password, name } = registerSchema.parse(body)

    // Dynamic imports for database
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcryptjs.hash(password, saltRounds)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })

    // Automatically sign in the user after successful registration
    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (signInResult?.error) {
      // User was created but sign-in failed - still return success
      return NextResponse.json(
        {
          message: 'User created successfully, please sign in manually',
          user: newUser,
          autoLoginFailed: true,
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        message: 'User created and logged in successfully',
        user: newUser,
        autoLoginSuccess: true,
      },
      { status: 201 }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Registration error:', error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
