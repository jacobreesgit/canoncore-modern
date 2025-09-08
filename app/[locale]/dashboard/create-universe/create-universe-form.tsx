'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createUniverse } from '@/lib/actions/universe-actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export function CreateUniverseForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createUniverse(formData)

      if (result?.success === false) {
        setError(result.error)
      }
      // If successful, redirect happens in the server action
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Marvel Cinematic Universe"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your universe and what content it will contain..."
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          name="isPublic"
          value="true"
          defaultChecked={true}
          disabled={isPending}
        />
        <Label htmlFor="isPublic">Make this universe public</Label>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Universe
        </Button>
      </div>
    </form>
  )
}
