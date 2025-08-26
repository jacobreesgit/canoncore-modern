'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/interactive/Button'
import { FormInput } from '@/components/forms/FormInput'
import { Navigation } from '@/components/layout/Navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account created successfully! You can now sign in.')
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className='min-h-screen bg-surface flex flex-col'>
      <Navigation showNavigationMenu={false} />

      <div className='flex items-center justify-center flex-1 py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-surface-elevated py-8 px-4 shadow sm:rounded-lg sm:px-10 sm:mx-auto sm:w-full sm:max-w-md'>
            <div className='text-center mb-6'>
              <h2 className='text-center text-xl font-semibold text-on-surface-elevated'>
                Create your account
              </h2>
              <p className='mt-2 text-center text-sm text-on-surface-muted'>
                Or{' '}
                <Link
                  href='/signin'
                  className='font-medium text-primary-600 hover:text-primary-500'
                >
                  sign in to your existing account
                </Link>
              </p>
            </div>

            {error && (
              <div className='mb-4 bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md'>
                {error}
              </div>
            )}

            {success && (
              <div className='mb-4 bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded-md'>
                {success}
              </div>
            )}

            <form className='space-y-6' onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-on-surface-elevated'
                >
                  Full Name
                </label>
                <div className='mt-1'>
                  <FormInput
                    id='name'
                    name='name'
                    type='text'
                    autoComplete='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder='Enter your full name'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-on-surface-elevated'
                >
                  Email address
                </label>
                <div className='mt-1'>
                  <FormInput
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder='Enter your email address'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-on-surface-elevated'
                >
                  Password
                </label>
                <div className='mt-1'>
                  <FormInput
                    id='password'
                    name='password'
                    type='password'
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder='Enter a strong password'
                  />
                </div>
                <p className='mt-1 text-sm text-on-surface-muted'>
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <Button
                  type='submit'
                  disabled={isLoading}
                  variant='primary'
                  size='default'
                  className='w-full'
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
