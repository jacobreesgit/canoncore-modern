'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateGroup } from '@/lib/actions/group-actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Group } from '@/lib/db/schema'

interface GroupEditFormProps {
  groupId: string
  collectionId: string
  universeId: string
  initialData: Group
}

export function GroupEditForm({
  groupId,
  collectionId,
  universeId,
  initialData,
}: GroupEditFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [itemType, setItemType] = useState<string>(initialData.itemType || 'other')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    formData.append('id', groupId)
    formData.append('collectionId', collectionId)
    formData.append('itemType', itemType)

    startTransition(async () => {
      const result = await updateGroup(formData)

      if (result?.success === false) {
        setError(result.error || 'An error occurred')
      } else {
        // Navigate back to group page on success
        router.push(`/universes/${universeId}/collections/${collectionId}/groups/${groupId}`)
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
          placeholder="e.g., Iron Man Series, Season 1, Original Trilogy"
          required
          disabled={isPending}
          aria-describedby={error ? "name-error" : undefined}
          aria-invalid={error ? "true" : "false"}
        />
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData.description || ''}
          placeholder="Describe this group and what content it contains..."
          rows={4}
          required
          disabled={isPending}
        />
      </div>

      {/* Item Type selection with accessibility */}
      <div className="space-y-2">
        <Label htmlFor="itemType">Item Type</Label>
        <Select
          value={itemType}
          onValueChange={setItemType}
          disabled={isPending}
        >
          <SelectTrigger id="itemType" aria-label="Select item type">
            <SelectValue placeholder="Select the type of content this group contains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="series">Series</SelectItem>
            <SelectItem value="movie">Movie</SelectItem>
            <SelectItem value="book">Book</SelectItem>
            <SelectItem value="game">Game</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
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
          Update Group
        </Button>
      </div>
    </form>
  )
}