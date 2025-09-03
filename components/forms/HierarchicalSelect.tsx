'use client'

import React, { forwardRef } from 'react'
import { FormSelect, FormSelectProps } from './FormSelect'
import { Content } from '@/lib/types'
import { createParentOptions } from '@/lib/utils/content-hierarchy'

export interface HierarchicalSelectProps
  extends Omit<FormSelectProps, 'children'> {
  allContent: Content[]
  relationships: { parentId: string | null; childId: string }[]
  excludeContentId?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
}

/**
 * Hierarchical Select Component
 * Renders content in a hierarchical dropdown with proper indentation and tree indicators
 */
const HierarchicalSelect = React.memo(
  forwardRef<HTMLSelectElement, HierarchicalSelectProps>(
    (
      {
        allContent,
        relationships,
        excludeContentId,
        includeNoneOption = true,
        noneOptionLabel = 'No parent (top level)',
        ...props
      },
      ref
    ) => {
      const hierarchicalOptions = createParentOptions(
        allContent,
        relationships,
        excludeContentId
      )

      return (
        <FormSelect ref={ref} {...props}>
          {includeNoneOption && <option value=''>{noneOptionLabel}</option>}
          {hierarchicalOptions.map(option => (
            <option
              key={option.id}
              value={option.id}
              disabled={option.disabled}
            >
              {option.displayName}
            </option>
          ))}
        </FormSelect>
      )
    }
  )
)

HierarchicalSelect.displayName = 'HierarchicalSelect'

export { HierarchicalSelect }
export default HierarchicalSelect
