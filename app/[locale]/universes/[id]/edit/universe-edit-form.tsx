'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { updateUniverse } from '@/lib/actions/universe-actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Universe } from '@/lib/db/schema'

interface UniverseEditFormProps {
  universeId: string
  initialData: Universe
}

export function UniverseEditForm({
  universeId,
  initialData,
}: UniverseEditFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    formData.append('id', universeId)

    startTransition(async () => {
      const result = await updateUniverse(formData)

      if (result?.success === false) {
        setError(result.error || 'An error occurred')
      } else {
        // Navigate back to universe page on success
        router.push(`/universes/${universeId}`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Accessible error handling with ARIA live region */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Name field with proper labeling and validation */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData.name}
          placeholder="e.g., Marvel Cinematic Universe"
          required
          disabled={isPending}
          aria-describedby={error ? "name-error" : undefined}
          aria-invalid={error ? "true" : "false"}
        />
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData.description || ''}
          placeholder="Describe your universe and what content it will contain..."
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Public visibility checkbox with clear labeling */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          name="isPublic"
          value="true"
          defaultChecked={initialData.isPublic}
          disabled={isPending}
        />
        <Label htmlFor="isPublic">Make this universe public</Label>
      </div>

      {/* Action buttons with loading states */}
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
          Update Universe
        </Button>
      </div>
    </form>
  )
}