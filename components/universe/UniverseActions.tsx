'use client'

import React, { useMemo } from 'react'
import { Universe } from '@/lib/types'
import { Icon } from '@/components/interactive/Icon'
import { HiPencil, HiTrash } from 'react-icons/hi'

interface UniverseActionsProps {
  universe: Universe
  isOwner: boolean
  onDelete: () => void
}

export function UniverseActions({
  universe,
  isOwner,
  onDelete,
}: UniverseActionsProps) {
  const pageActions = useMemo(() => {
    const actions = []

    if (isOwner) {
      actions.push(
        {
          type: 'secondary' as const,
          label: 'Edit Universe',
          href: `/universes/${universe.id}/edit`,
          icon: <Icon icon={HiPencil} />,
        },
        {
          type: 'danger' as const,
          label: 'Delete Universe',
          onClick: onDelete,
          icon: <Icon icon={HiTrash} />,
        }
      )
    }

    return actions
  }, [isOwner, universe.id, onDelete])

  return pageActions
}
