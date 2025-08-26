'use client'

import React from 'react'
import { Button, ButtonLink } from '../interactive/Button'
import { cn } from '@/lib/utils'

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'create' | 'update' | 'add'
  size?: 'default'
  className?: string
  cancelHref: string
  isSubmitting?: boolean
  submitLabel?: string
  submittingLabel?: string
}

export function FormActions({
  variant = 'create',
  className = '',
  cancelHref,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
  ...props
}: FormActionsProps) {
  const getLabels = () => {
    switch (variant) {
      case 'create':
        return {
          submit: submitLabel || 'Create Franchise',
          submitting: submittingLabel || 'Creating...',
        }
      case 'update':
        return {
          submit: submitLabel || 'Save Changes',
          submitting: submittingLabel || 'Saving...',
        }
      case 'add':
        return {
          submit: submitLabel || 'Add Content',
          submitting: submittingLabel || 'Adding...',
        }
      default:
        return {
          submit: submitLabel || 'Submit',
          submitting: submittingLabel || 'Submitting...',
        }
    }
  }

  const labels = getLabels()

  return (
    <div
      className={cn(
        'form-actions',
        'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-4 space-y-3 space-y-reverse sm:space-y-0 sm:space-x-4',
        className
      )}
      {...props}
    >
      <ButtonLink
        variant='danger'
        href={cancelHref}
        className='w-full sm:w-auto'
      >
        Cancel
      </ButtonLink>
      <Button
        type='submit'
        variant='primary'
        disabled={isSubmitting}
        className='w-full sm:w-auto'
      >
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </div>
  )
}

export default FormActions
