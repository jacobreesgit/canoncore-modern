import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { UniverseEditForm } from './universe-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UniverseEditPageProps {
  params: Promise<{ id: string }>
}

export default async function UniverseEditPage({ params }: UniverseEditPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  // Fetch existing universe data for form pre-population
  const universeResult = await UniverseService.getById(id, session.user.id)

  if (!universeResult.success || !universeResult.data) {
    notFound()
  }

  return (
    <div className="flex-1 container mx-auto py-8">
      {/* Header with accessible navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/universes/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Universe
          </Link>
        </Button>
      </div>

      {/* Edit Form Section with accessible headings */}
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Universe</h1>
          <p className="text-muted-foreground">
            Update your universe information and settings
          </p>
        </div>

        <UniverseEditForm 
          universeId={id}
          initialData={universeResult.data}
        />
      </div>
    </div>
  )
}