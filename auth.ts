import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './lib/db'
import { UserService } from './lib/services/user.service'
import { userValidation } from './lib/validations'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async credentials => {
        try {
          // Use consistent validation schema
          const { email, password } = userValidation.signIn.parse(credentials)

          // Use UserService for consistent authentication logic
          const result = await UserService.authenticate({ email, password })

          if (!result.success) {
            return null
          }

          return {
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            image: result.data.image,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  trustHost: true,
})
