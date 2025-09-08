'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Globe, Users, Eye, Edit } from 'lucide-react'
import type { Universe } from '@/lib/db/schema'

interface DashboardClientProps {
  universes: Universe[]
}

export function DashboardClient({ universes }: DashboardClientProps) {
  const router = useRouter()

  const handleEditClick = (e: React.MouseEvent, universeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/universes/${universeId}/edit`)
  }

  return (
    <div className="flex-1 container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Universes</h1>
          <p className="text-muted-foreground">
            Manage your content universes and franchises
          </p>
        </div>
        {universes.length > 0 && (
          <Button asChild>
            <Link href="/dashboard/create-universe">
              <Plus className="mr-2 h-4 w-4" />
              Create Universe
            </Link>
          </Button>
        )}
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
            <div key={universe.id} className="h-full">
              <Link
                href={`/universes/${universe.id}`}
                className="block h-full group focus:outline-none"
                aria-label={`View ${universe.name} universe`}
              >
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col group-hover:border-primary/50 group-focus:border-primary group-focus:ring-2 group-focus:ring-primary/20 cursor-pointer">
                  <CardHeader className="flex-grow">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {universe.name}
                      </CardTitle>
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
                  <CardContent className="mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-3 w-3" />
                        <span>{universe.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => handleEditClick(e, universe.id)}
                        aria-label={`Edit ${universe.name} universe`}
                        className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground z-10 relative"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}