import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Globe, Users, Eye } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const universes = await UniverseService.getByUser(session.user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Universes</h1>
          <p className="text-muted-foreground">
            Manage your content universes and franchises
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create-universe">
            <Plus className="mr-2 h-4 w-4" />
            Create Universe
          </Link>
        </Button>
      </div>

      {universes.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No universes yet</CardTitle>
            <CardDescription>
              Create your first universe to start organizing your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/create-universe">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Universe
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {universes.map(universe => (
            <Card
              key={universe.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{universe.name}</CardTitle>
                  {universe.isPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {universe.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-3 w-3" />
                    <span>{universe.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/universes/${universe.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
