'use client'

import React, { useEffect, useState, forwardRef } from 'react'
import { FormInput, FormInputProps } from './FormInput'

export interface FormURLInputProps extends Omit<FormInputProps, 'type'> {
  showPreview?: boolean
  validationError?: string
  onValidationChange?: (
    isValid: boolean,
    normalizedUrl?: string,
    hasValue?: boolean
  ) => void
}

function validateURL(input: string): {
  isValid: boolean
  normalizedUrl?: string
  errorMessage?: string
} {
  if (!input.trim()) {
    return { isValid: true }
  }

  try {
    let urlToValidate = input.trim()

    if (
      !urlToValidate.startsWith('http://') &&
      !urlToValidate.startsWith('https://')
    ) {
      urlToValidate = 'https://' + urlToValidate
    }

    const url = new URL(urlToValidate)
    const normalizedUrl = url.href

    return {
      isValid: true,
      normalizedUrl,
    }
  } catch {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid URL',
    }
  }
}

const FormURLInput = forwardRef<HTMLInputElement, FormURLInputProps>(
  (
    {
      validationError,
      onValidationChange,
      className = '',
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(defaultValue?.toString() || '')
    const [validationState, setValidationState] = useState<{
      isValid: boolean
      normalizedUrl?: string
      errorMessage?: string
    }>({ isValid: true })

    useEffect(() => {
      if (!inputValue.trim()) {
        setValidationState({ isValid: true })
        onValidationChange?.(true)
        return
      }

      const timeoutId = setTimeout(() => {
        const result = validateURL(inputValue)
        setValidationState(result)
      }, 300)

      return () => clearTimeout(timeoutId)
    }, [inputValue, onValidationChange])

    useEffect(() => {
      onValidationChange?.(
        validationState.isValid,
        validationState.normalizedUrl,
        Boolean(inputValue.trim())
      )
    }, [
      validationState.isValid,
      validationState.normalizedUrl,
      inputValue,
      onValidationChange,
    ])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      onChange?.(e)
    }

    const inputVariant =
      validationError || validationState.errorMessage ? 'error' : props.variant

    return (
      <div className='space-y-2'>
        <FormInput
          {...props}
          ref={ref}
          type='text'
          variant={inputVariant}
          className={className}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            props.placeholder || 'https://example.com or example.com'
          }
        />

        {(validationError || validationState.errorMessage) && (
          <div className='text-sm text-red-600 mt-1'>
            {validationError || validationState.errorMessage}
          </div>
        )}

        {!inputValue.trim() && !validationError && (
          <div className='text-sm text-gray-500 mt-1'>
            Accepts URLs with or without https:// (e.g., &quot;example.com&quot;
            or &quot;https://www.example.com&quot;)
          </div>
        )}
      </div>
    )
  }
)

FormURLInput.displayName = 'FormURLInput'

export { FormURLInput }
export default FormURLInput
