import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { CollectionService } from '@/lib/services/collection.service'
import { CreateGroupForm } from './create-group-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CreateGroupPageProps {
  params: { id: string; collectionId: string }
}

export default async function CreateGroupPage({
  params,
}: CreateGroupPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const collectionResult = await CollectionService.getById(
    params.collectionId,
    session.user.id
  )

  if (!collectionResult.success || !collectionResult.data) {
    notFound()
  }

  const universeResult = await UniverseService.getById(
    params.id,
    session.user.id
  )

  if (!universeResult.success || !universeResult.data) {
    notFound()
  }

  const collection = collectionResult.data!

  return (
    <div className="flex-1 container mx-auto py-8 max-w-2xl">
      {/* Back Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={`/universes/${params.id}/collections/${params.collectionId}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {collection.name}
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Group</h1>
        <p className="text-muted-foreground">
          Add a new group to organize content within {collection.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>
            Groups help categorize content by series, seasons, or other
            organizational methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm collectionId={params.collectionId} />
        </CardContent>
      </Card>
    </div>
  )
}
