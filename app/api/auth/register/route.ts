import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use consistent UserService for registration
    const result = await UserService.create(body)

    if (!result.success) {
      // Map service error codes to appropriate HTTP status codes
      const statusMap = {
        VALIDATION_ERROR: 400,
        USER_EXISTS: 400,
        USER_NOT_FOUND: 404,
        INVALID_CREDENTIALS: 401,
        DATABASE_ERROR: 500,
      }

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusMap[result.code] || 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: result.data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'DATABASE_ERROR' },
      { status: 500 }
    )
  }
}
