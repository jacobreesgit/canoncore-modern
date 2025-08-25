import { notFound, redirect } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/auth-helpers'
import { userService } from '@/lib/services'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AccountDeletionSection } from '@/components/profile/AccountDeletionSection'

interface EditProfilePageProps {
  params: Promise<{ userId: string }>
}

/**
 * Edit Profile Page - Server Component
 *
 * Allows users to edit their own profile information
 * Includes permission gating to ensure users can only edit their own profiles
 */
export default async function EditProfilePage({
  params,
}: EditProfilePageProps) {
  const { userId } = await params

  // Require authentication
  const session = await requireAuth()

  // Verify user can only edit their own profile
  if (session.user?.id !== userId) {
    redirect(`/profile/${userId}`)
  }

  try {
    // Fetch current user data
    const user = await userService.getById(userId)

    if (!user) {
      notFound()
    }

    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-2xl px-4 py-8'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Edit Profile</h1>
            <p className='text-gray-600'>Update your profile information</p>
          </div>

          <div className='space-y-6'>
            <div className='rounded-lg bg-white p-6 shadow-sm'>
              <ProfileEditForm user={user} />
            </div>

            <AccountDeletionSection />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading edit profile page:', error)
    notFound()
  }
}
