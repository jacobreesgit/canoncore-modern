'use client'

import React, { useRef } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

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
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Enter key for quick confirmation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size='md'>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <p className='text-neutral-600' id='confirm-modal-message'>
          {message}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          ref={confirmButtonRef}
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
        >
          {isLoading ? 'Loading...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmModal
