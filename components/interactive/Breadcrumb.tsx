'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/interactive/Button'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  isCurrentPage?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      className={cn('mb-2 overflow-x-auto', className)}
      aria-label='Breadcrumb'
    >
      <ol className='flex items-center space-x-2 text-sm text-neutral-600 min-w-max'>
        {items.map((item, index) => (
          <li key={index} className='flex items-center whitespace-nowrap'>
            {index > 0 && <span className='text-neutral-400 mr-2'>/</span>}
            {item.onClick && !item.isCurrentPage ? (
              <Button
                onClick={item.onClick}
                variant='clear'
                className='text-primary-600 hover:text-primary-700 transition-colors cursor-pointer p-0'
                aria-current={item.isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </Button>
            ) : item.href && !item.isCurrentPage ? (
              <Link
                href={item.href}
                className='text-primary-600 hover:text-primary-700 transition-colors'
                aria-current={item.isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  item.isCurrentPage
                    ? 'text-neutral-900 font-medium'
                    : 'text-neutral-600'
                }
                aria-current={item.isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
