import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { CollectionService } from '@/lib/services/collection.service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GroupTree } from '@/components/tree/group-tree'
import Link from 'next/link'
import { Plus, Edit, Calendar, Package, TreePine } from 'lucide-react'

interface CollectionPageProps {
  params: { id: string; collectionId: string }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  // Fetch complete collection hierarchy for tree display
  const hierarchyResult = await CollectionService.getCompleteHierarchy(
    params.collectionId,
    session.user.id
  )

  if (!hierarchyResult.success || !hierarchyResult.data) {
    notFound()
  }

  const hierarchyData = hierarchyResult.data

  const {
    collection,
    groups,
    content,
    groupRelationships,
    contentRelationships,
  } = hierarchyData

  // Get universe for breadcrumbs
  const universeResult = await UniverseService.getById(
    collection.universeId,
    session.user.id
  )

  if (!universeResult.success || !universeResult.data) {
    notFound()
  }

  const universe = universeResult.data

  return (
    <div className="flex-1 container mx-auto py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/universes/${universe.id}`}
          className="hover:text-foreground"
        >
          {universe.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{collection.name}</span>
      </div>

      {/* Collection Overview */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {collection.name}
            </h1>
            <Badge variant="secondary">Collection</Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            {collection.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {new Date(collection.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/universes/${universe.id}/collections/${collection.id}/edit`}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {groups.length > 0 && (
            <Button asChild>
              <Link
                href={`/universes/${universe.id}/collections/${collection.id}/create-group`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Group
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content Hierarchy */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TreePine className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Content Hierarchy</h2>
        </div>

        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No groups yet</CardTitle>
              <CardDescription>
                Create your first group to start organizing content within this
                collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link
                  href={`/universes/${universe.id}/collections/${collection.id}/create-group`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <GroupTree
            universeId={universe.id}
            collectionId={collection.id}
            hierarchyData={{
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
