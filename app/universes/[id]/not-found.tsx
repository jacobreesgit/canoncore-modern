import { PageLayout } from '@/components/layout/PageLayout'
import { ButtonLink } from '@/components/interactive/Button'

export default function NotFound() {
  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Universe Not Found',
        description:
          "The universe you're looking for doesn't exist or you don't have permission to view it.",
      }}
    >
      <div className='text-center py-12'>
        <div className='bg-surface-elevated rounded-lg shadow-sm p-6 max-w-md mx-auto border border-surface-200 hover:shadow-md transition-shadow'>
          <div className='flex justify-center gap-4'>
            <ButtonLink href='/dashboard' variant='primary'>
              Back to Dashboard
            </ButtonLink>
            <ButtonLink href='/discover' variant='secondary'>
              Discover Universes
            </ButtonLink>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
