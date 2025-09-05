import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { CreateCollectionForm } from './create-collection-form'
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

interface CreateCollectionPageProps {
  params: { id: string }
}

export default async function CreateCollectionPage({
  params,
}: CreateCollectionPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const universe = await UniverseService.getById(params.id, session.user.id)

  if (!universe) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/universes/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {universe.name}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Collection
          </h1>
          <p className="text-muted-foreground">
            Add a new collection to organize content within {universe.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <CardDescription>
            Collections help organize content chronologically or thematically
            within your universe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCollectionForm universeId={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
