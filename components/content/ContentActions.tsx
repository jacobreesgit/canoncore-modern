'use client'

import React, { useMemo } from 'react'
import { Content, Universe } from '@/lib/types'
import { Icon } from '@/components/interactive/Icon'
import { HiPencil, HiTrash } from 'react-icons/hi'

interface ContentActionsProps {
  content: Content
  universe: Universe
  isOwner: boolean
  isUniverseOwner: boolean
  onDelete: () => void
}

export function ContentActions({
  content,
  universe,
  isOwner,
  isUniverseOwner,
  onDelete,
}: ContentActionsProps) {
  const pageActions = useMemo(() => {
    const actions = []

    if (isOwner || isUniverseOwner) {
      actions.push(
        {
          type: 'secondary' as const,
          label: 'Edit Content',
          href: `/universes/${universe.id}/content/${content.id}/edit`,
          icon: <Icon icon={HiPencil} />,
        },
        {
          type: 'danger' as const,
          label: 'Delete Content',
          onClick: onDelete,
          icon: <Icon icon={HiTrash} />,
        }
      )
    }

    return actions
  }, [universe.id, content.id, isOwner, isUniverseOwner, onDelete])

  return pageActions
}
