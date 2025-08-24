import { Suspense, ReactNode } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export function SuspenseWrapper({
  children,
  fallback,
  className = '',
}: SuspenseWrapperProps) {
  const defaultFallback = (
    <div
      className={`min-h-[200px] flex items-center justify-center ${className}`}
    >
      <LoadingSpinner size='lg' />
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}
