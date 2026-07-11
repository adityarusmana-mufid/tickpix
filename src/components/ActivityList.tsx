import { useState } from 'react'
import type { Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'

const PRESET_COLORS = ['#feb236', '#d64161', '#6b5b95', '#3fb0ac', '#7ebd7e', '#c0c0c0', '#ff6b6b', '#4ecdc4']

interface Props {
  activities: Activity[]
  onAdd: (name: string, color: string) => void
  onRemove: (id: string) => void
}

export default function ActivityList({ activities, onAdd, onRemove }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName('')
  }

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-1">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-2 py-1.5 bg-[#1a1a2e] border-2 border-[#2a2a3e]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#2a2a3e]" style={{ backgroundColor: a.color }} />
              <span className="text-xs text-[#c0c0d0] font-pixel">{a.name}</span>
            </div>
            <button
              onClick={() => onRemove(a.id)}
              className="text-xs text-[#808090] hover:text-red-400 font-pixel"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        className="w-full px-2 py-1 text-xs bg-[#1a1a2e] border-2 border-[#2a2a3e] text-[#c0c0d0] font-pixel outline-none focus:border-[#6b6b9e]"
        placeholder="New activity..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <div className="flex gap-1 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 border-2 ${color === c ? 'border-white' : 'border-[#2a2a3e]'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <Button variant="secondary" size="sm" className="w-full" onClick={handleAdd}>
        + ADD
      </Button>
    </div>
  )
}
