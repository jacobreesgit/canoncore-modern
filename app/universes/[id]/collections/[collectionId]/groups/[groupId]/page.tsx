import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { CollectionService } from '@/lib/services/collection.service'
import { GroupService } from '@/lib/services/group.service'
import { ContentService } from '@/lib/services/content.service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Edit, Eye, EyeOff, Calendar, FileText } from 'lucide-react'

interface GroupPageProps {
  params: { id: string; collectionId: string; groupId: string }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const group = await GroupService.getById(params.groupId, session.user.id)

  if (!group) {
    notFound()
  }

  const collection = await CollectionService.getById(
    params.collectionId,
    session.user.id
  )
  const universe = await UniverseService.getById(params.id, session.user.id)
  const content = await ContentService.getByGroup(
    params.groupId,
    session.user.id
  )

  if (!collection || !universe) {
    notFound()
  }

  const viewableContent = content.filter(c => c.isViewable)
  const organizationalContent = content.filter(c => !c.isViewable)

  return (
    <div className="container mx-auto py-8">
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
        <Link
          href={`/universes/${universe.id}/collections/${collection.id}`}
          className="hover:text-foreground"
        >
          {collection.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{group.name}</span>
      </div>

      {/* Group Overview */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant="secondary">{group.itemType}</Badge>
          </div>
          <p className="text-muted-foreground text-lg">{group.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {new Date(group.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {content.length} {content.length === 1 ? 'Item' : 'Items'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {viewableContent.length} Viewable
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/edit`}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/create-content`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Viewable Content */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Viewable Content</h2>

          {viewableContent.length === 0 ? (
            <Card className="text-center py-8">
              <CardHeader>
                <CardTitle>No viewable content yet</CardTitle>
                <CardDescription>
                  Add viewable content that users can track and mark as watched
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link
                    href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/create-content`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Viewable Content
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {viewableContent.map(item => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.itemType}</Badge>
                        <Eye className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <CardDescription className="line-clamp-1">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.releaseDate
                            ? new Date(item.releaseDate).toLocaleDateString()
                            : 'No date'}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/content/${item.id}`}
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Organizational Content */}
        {organizationalContent.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Organizational Content
            </h2>
            <div className="grid gap-4">
              {organizationalContent.map(item => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow opacity-75"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.itemType}</Badge>
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <CardDescription className="line-clamp-1">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Organizational content
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/content/${item.id}`}
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {content.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No content yet</CardTitle>
              <CardDescription>
                Start adding content to this group to organize your universe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link
                  href={`/universes/${universe.id}/collections/${collection.id}/groups/${group.id}/create-content`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Content
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
