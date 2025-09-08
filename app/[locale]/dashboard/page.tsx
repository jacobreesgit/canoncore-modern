import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UniverseService } from '@/lib/services/universe.service'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const universesResult = await UniverseService.getByUser(session.user.id)

  if (!universesResult.success) {
    // Handle error case - could redirect to error page or show error message
    throw new Error(`Failed to load universes: ${universesResult.error}`)
  }

  const universes = universesResult.data

  return <DashboardClient universes={universes} />
}
