import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { ButtonLink } from '@/components/interactive/Button'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <div className='text-center py-12'>
          <div className='bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto'>
            <h1 className='text-xl font-semibold text-gray-900 mb-2'>
              Universe Not Found
            </h1>
            <p className='text-gray-600 mb-6'>
              The universe you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
            <div className='flex justify-center gap-4'>
              <ButtonLink href='/' variant='primary'>
                Back to Dashboard
              </ButtonLink>
              <ButtonLink href='/discover' variant='secondary'>
                Discover Universes
              </ButtonLink>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
