'use client'

import React, { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { FormSelect } from './FormSelect'
import { FormInput } from './FormInput'
import { FormField } from './FormField'
import { Button } from '../interactive/Button'
import { Badge } from '../content/Badge'
import { Modal } from '../interactive/Modal'
import { createSourceAction } from '@/lib/actions/source-actions'
import type { Source } from '@/lib/types'

export interface SourceSelectProps {
  name: string
  universeId: string
  sources: Source[]
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  onSourceCreated?: (source: Source) => void
  disabled?: boolean
}

export function SourceSelect({
  name,
  universeId,
  sources,
  value = '',
  onChange,
  onSourceCreated,
  disabled = false,
}: SourceSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#e0f2fe')
  const [textColor, setTextColor] = useState('#0369a1')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSource = async () => {
    if (!newSourceName.trim()) return

    setIsCreating(true)
    try {
      // Call server action to create source
      const result = await createSourceAction(
        universeId,
        newSourceName.trim(),
        backgroundColor,
        textColor
      )

      if (!result.success || !result.source) {
        console.error('Failed to create source:', result.error)
        return
      }

      const newSource = result.source

      if (onSourceCreated) {
        onSourceCreated(newSource)
      }

      setNewSourceName('')
      setBackgroundColor('#e0f2fe')
      setTextColor('#0369a1')
      setIsModalOpen(false)

      // Select the newly created source
      if (onChange) {
        const fakeEvent = {
          target: { value: newSource.id },
        } as React.ChangeEvent<HTMLSelectElement>
        onChange(fakeEvent)
      }
    } catch (error) {
      console.error('Failed to create source:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === 'create-new') {
      setIsModalOpen(true)
      return
    }
    if (onChange) {
      onChange(event)
    }
  }

  return (
    <>
      <FormSelect
        name={name}
        value={value}
        onChange={handleSelectChange}
        disabled={disabled}
      >
        <option value=''>No source selected</option>
        {sources.map(source => (
          <option key={source.id} value={source.id}>
            {source.name}
          </option>
        ))}
        <option value='create-new'>+ Create New Source</option>
      </FormSelect>

      {/* Create Source Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size='md'
        closeOnBackdropClick={!isCreating}
        closeOnEscape={!isCreating}
      >
        <Modal.Header>Create New Source</Modal.Header>

        <Modal.Body>
          <div className='space-y-4'>
            <FormField label='Source Name' required>
              <FormInput
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                placeholder='e.g., Disney+, Torchwood, Television'
                disabled={isCreating}
              />
            </FormField>

            <FormField label='Background Color'>
              <div className='space-y-3'>
                <HexColorPicker
                  color={backgroundColor}
                  onChange={setBackgroundColor}
                />
                <span className='text-sm text-neutral-600'>
                  {backgroundColor}
                </span>
              </div>
            </FormField>

            <FormField label='Text Color'>
              <div className='space-y-3'>
                <HexColorPicker color={textColor} onChange={setTextColor} />
                <span className='text-sm text-neutral-600'>{textColor}</span>
              </div>
            </FormField>

            <FormField label='Preview'>
              <Badge backgroundColor={backgroundColor} textColor={textColor}>
                {newSourceName || 'Preview'}
              </Badge>
            </FormField>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setIsModalOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleCreateSource}
            disabled={isCreating || !newSourceName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Source'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default SourceSelect
