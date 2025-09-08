import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { GroupService } from '@/lib/services/group.service'
import { GroupEditForm } from './group-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface GroupEditPageProps {
  params: Promise<{ 
    id: string
    collectionId: string
    groupId: string
  }>
}

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { id, collectionId, groupId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  // Fetch existing group data for form pre-population
  const groupResult = await GroupService.getById(groupId, session.user.id)

  if (!groupResult.success || !groupResult.data) {
    notFound()
  }

  return (
    <div className="flex-1 container mx-auto py-8">
      {/* Header with accessible navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/universes/${id}/collections/${collectionId}/groups/${groupId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Group
          </Link>
        </Button>
      </div>

      {/* Edit Form Section with accessible headings */}
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Group</h1>
          <p className="text-muted-foreground">
            Update your group information and settings
          </p>
        </div>

        <GroupEditForm 
          groupId={groupId}
          collectionId={collectionId}
          universeId={id}
          initialData={groupResult.data}
        />
      </div>
    </div>
  )
}