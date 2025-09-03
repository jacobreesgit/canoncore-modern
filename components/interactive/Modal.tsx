'use client'

import React, { useEffect, useRef, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  children: React.ReactNode
}

interface ModalContextValue {
  onClose: () => void
  titleId: string
}

const ModalContext = createContext<ModalContextValue | null>(null)

const sizeStyles = {
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const titleId = useRef(
    `modal-title-${Math.random().toString(36).substr(2, 9)}`
  ).current

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Tab') {
        // Basic focus trap - can be enhanced with more sophisticated logic
        const modal = modalRef.current
        if (!modal) return

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    // Focus first interactive element when modal opens
    const focusFirstElement = () => {
      const modal = modalRef.current
      if (modal) {
        const firstFocusable = modal.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        firstFocusable?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    setTimeout(focusFirstElement, 0) // Delay to ensure modal is rendered

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to previously focused element
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose, closeOnEscape])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <ModalContext.Provider value={{ onClose, titleId }}>
      <div
        className='fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50'
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className={cn(
            'bg-white rounded-lg shadow-xl w-full transform transition-all',
            sizeStyles[size]
          )}
          role='dialog'
          aria-modal='true'
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

// Modal.Header component
interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

Modal.Header = function ModalHeader({ children, className }: ModalHeaderProps) {
  const context = useContext(ModalContext)

  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      <h3
        id={context?.titleId}
        className='text-lg font-medium text-neutral-900'
      >
        {children}
      </h3>
    </div>
  )
}

// Modal.Body component
interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

Modal.Body = function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('px-6', className)}>{children}</div>
}

// Modal.Footer component
interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

Modal.Footer = function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 flex justify-end gap-4', className)}>
      {children}
    </div>
  )
}

export default Modal
