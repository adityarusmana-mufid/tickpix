import { useState, useEffect } from 'react'
import type { Block, Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/pixelact-ui/select'

interface Props {
  block: Block | null
  activities: Activity[]
  onUpdate: (id: string, updates: Partial<Block>) => void
  onRemove: (id: string) => void
  onClose: () => void
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function BlockEditor({ block, activities, onUpdate, onRemove, onClose }: Props) {
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    if (block) setCustomText(block.customLabel ?? '')
  }, [block])

  if (!block) {
    return (
      <div className="p-3 text-xs text-[#808090] font-pixel text-center">
        Click a block on the clock to edit
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-pixel text-[#c0c0d0]">
          {formatHour(block.startHour)} – {formatHour(block.endHour)}
        </span>
        <Button variant="link" size="sm" onClick={onClose}>×</Button>
      </div>

      <Select
        value={block.activityId ?? ''}
        onValueChange={(val) => {
          onUpdate(block.id, { activityId: val || null, customLabel: val ? null : customText || null })
        }}
      >
        <SelectTrigger className="text-xs font-pixel">
          <SelectValue placeholder="Custom..." />
        </SelectTrigger>
        <SelectContent className="font-pixel">
          <SelectItem value="">Custom...</SelectItem>
          {activities.map((a) => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!block.activityId && (
        <input
          className="w-full px-2 py-1 text-xs bg-[#1a1a2e] border-2 border-[#2a2a3e] text-[#c0c0d0] font-pixel outline-none focus:border-[#6b6b9e]"
          placeholder="Custom label..."
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value)
            onUpdate(block.id, { customLabel: e.target.value || null })
          }}
        />
      )}

      <Button variant="destructive" size="sm" className="w-full" onClick={() => { onRemove(block.id); onClose() }}>
        DELETE BLOCK
      </Button>
    </div>
  )
}
