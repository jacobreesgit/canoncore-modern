'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from './Button'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary' | 'secondary'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      } else if (event.key === 'Enter' && !isLoading) {
        event.preventDefault()
        onConfirm()
      }
    }

    // Focus the confirm button when modal opens
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm, isLoading])

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div
        ref={modalRef}
        className='bg-white rounded-lg p-6 w-full max-w-md'
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
        aria-describedby='modal-message'
      >
        <h3
          id='modal-title'
          className='text-lg font-medium text-neutral-900 mb-4'
        >
          {title}
        </h3>
        <p id='modal-message' className='text-neutral-600 mb-6'>
          {message}
        </p>
        <div className='flex justify-end gap-4'>
          <Button variant='secondary' onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
