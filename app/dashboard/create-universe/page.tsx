import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CreateUniverseForm } from './create-universe-form'
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

export default async function CreateUniversePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Universe</h1>
          <p className="text-muted-foreground">
            Start organizing your content with a new universe
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Universe Details</CardTitle>
          <CardDescription>
            Create a new universe to contain your collections, groups, and
            content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUniverseForm />
        </CardContent>
      </Card>
    </div>
  )
}
