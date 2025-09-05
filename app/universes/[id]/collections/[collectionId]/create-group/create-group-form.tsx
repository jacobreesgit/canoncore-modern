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
import { createGroup } from '@/lib/actions/group-actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface CreateGroupFormProps {
  collectionId: string
}

export function CreateGroupForm({ collectionId }: CreateGroupFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [itemType, setItemType] = useState<string>('other')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    formData.append('collectionId', collectionId)
    formData.append('itemType', itemType)

    startTransition(async () => {
      const result = await createGroup(formData)

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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Iron Man Series, Season 1, Original Trilogy"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe this group and what content it contains..."
          rows={4}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemType">Item Type</Label>
        <Select
          value={itemType}
          onValueChange={setItemType}
          disabled={isPending}
        >
          <SelectTrigger>
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
          Create Group
        </Button>
      </div>
    </form>
  )
}
