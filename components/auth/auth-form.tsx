'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, UserPlus, Check } from 'lucide-react'
import { userValidation } from '@/lib/validations'
import { z } from 'zod'

type AuthMode = 'signin' | 'signup'

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateSignIn = () => {
    try {
      userValidation.signIn.parse({
        email: formData.email,
        password: formData.password,
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
        return false
      }
      setError('Invalid form data')
      return false
    }
  }

  const validateSignUp = () => {
    try {
      userValidation.signUp.parse({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }

      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
        return false
      }
      setError('Invalid form data')
      return false
    }
  }

  const handleSignIn = async () => {
    if (!validateSignIn()) return

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
    } else if (result?.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignUp = async () => {
    if (!validateSignUp()) return

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)

      // Auto sign-in after successful registration
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/dashboard')
          router.refresh()
        }
      }, 1000)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await handleSignIn()
      } else {
        await handleSignUp()
      }
    } catch (error) {
      console.error(`${mode} error:`, error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setSuccess(false)
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                Account created successfully!
              </h3>
              <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {mode === 'signin' ? 'Sign in to CanonCore' : 'Create your account'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'signin'
            ? 'Enter your credentials to access your universes'
            : 'Join CanonCore to start organizing your content universes'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={
                  mode === 'signin'
                    ? 'Enter your password'
                    : 'Create a password (min. 6 characters)'
                }
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {mode === 'signin' ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-medium text-primary hover:underline"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-medium text-primary hover:underline"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
