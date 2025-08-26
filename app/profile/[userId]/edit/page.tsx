import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'
import { userService } from '@/lib/services'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AccountDeletionSection } from '@/components/profile/AccountDeletionSection'
import { PageLayout } from '@/components/layout/PageLayout'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

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
      <PageLayout
        currentPage='profile'
        header={{
          title: 'Edit Profile',
          description: 'Update your profile information',
          breadcrumbs: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Profile', href: `/profile/${userId}` },
            { label: 'Edit', href: `/profile/${userId}/edit` },
          ],
        }}
      >
        <div className='space-y-6'>
          <div className='rounded-lg bg-surface-elevated p-6 shadow-sm'>
            <ProfileEditForm user={user} />
          </div>

          <AccountDeletionSection />
        </div>
      </PageLayout>
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading edit profile page:', error)
    }
    notFound()
  }
}
