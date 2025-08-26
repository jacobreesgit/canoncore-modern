'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/interactive/Button'
import { FormInput } from '@/components/forms/FormInput'
import { Navigation } from '@/components/layout/Navigation'

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
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
                Sign in to your account
              </h2>
              <p className='mt-2 text-center text-sm text-on-surface-muted'>
                Or{' '}
                <Link
                  href='/register'
                  className='font-medium text-primary-600 hover:text-primary-500'
                >
                  create a new account
                </Link>
              </p>
            </div>

            {error && (
              <div className='mb-4 bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md'>
                {error}
              </div>
            )}

            <form className='space-y-6' onSubmit={handleSubmit}>
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
                    autoComplete='current-password'
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder='Enter your password'
                  />
                </div>
              </div>

              <div>
                <Button
                  type='submit'
                  disabled={isLoading}
                  variant='primary'
                  size='default'
                  className='w-full'
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
