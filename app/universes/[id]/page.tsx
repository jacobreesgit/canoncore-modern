import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CollectionTree } from '@/components/tree/collection-tree'
import Link from 'next/link'
import {
  Plus,
  Globe,
  Eye,
  Edit,
  ArrowLeft,
  FolderOpen,
  Calendar,
  TreePine,
} from 'lucide-react'

interface UniversePageProps {
  params: { id: string }
}

export default async function UniversePage({ params }: UniversePageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  // Fetch complete universe hierarchy for tree display
  const hierarchyData = await UniverseService.getCompleteHierarchy(
    params.id,
    session.user.id
  ).catch(() => null)

  if (!hierarchyData?.universe) {
    notFound()
  }

  const {
    universe,
    collections,
    groups,
    content,
    groupRelationships,
    contentRelationships,
  } = hierarchyData

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Universe Overview */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {universe.name}
            </h1>
            {universe.isPublic ? (
              <Badge variant="secondary">
                <Globe className="mr-1 h-3 w-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline">
                <Eye className="mr-1 h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            {universe.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {new Date(universe.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {collections.length}{' '}
              {collections.length === 1 ? 'Collection' : 'Collections'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/universes/${universe.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/universes/${universe.id}/create-collection`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Collection
            </Link>
          </Button>
        </div>
      </div>

      {/* Content Hierarchy */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TreePine className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Content Hierarchy</h2>
        </div>

        {collections.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No collections yet</CardTitle>
              <CardDescription>
                Create your first collection to start organizing content within
                this universe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/universes/${universe.id}/create-collection`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Collection
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CollectionTree
            universeId={universe.id}
            hierarchyData={{
              collections,
              groups,
              content,
              groupRelationships,
              contentRelationships,
            }}
            className="max-w-4xl"
          />
        )}
      </div>
    </div>
  )
}
