import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Basic health check
    const health: {
      status: string
      timestamp: string
      uptime: number
      version: string
      database?: string
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    }

    // Test database connection
    try {
      await db.execute('SELECT 1')
      health.database = 'connected'
    } catch (error) {
      health.database = 'disconnected'
      health.status = 'unhealthy'
      console.error('Database health check failed:', error)
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
