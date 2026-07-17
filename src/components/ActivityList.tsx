import { useState } from 'react'
import type { Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/pixelact-ui/dialog'

const PRESET_COLORS = ['#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ab5236']

interface Props {
  activities: Activity[]
  onAdd: (name: string, color: string) => void
  onRemove: (id: string) => void
}

export default function ActivityList({ activities, onAdd, onRemove }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName('')
  }

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-1">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-2 py-1.5 bg-[#c5996c] border-2 border-[#835a4d]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#835a4d]" style={{ backgroundColor: a.color }} />
              <span className="text-xs text-[#3a3028] font-pixel">{a.name}</span>
            </div>
            <button
              onClick={() => setPendingRemove(a.id)}
              className="text-xs text-[#3a3028] hover:text-[#3a3028] font-pixel"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none focus:border-[#835a4d]"
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
            className={`w-5 h-5 border-2 ${color === c ? 'border-[#835a4d]' : 'border-[#835a4d]'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <Button variant="secondary" size="sm" className="w-full" onClick={handleAdd}>
        + ADD
      </Button>

      <Dialog open={pendingRemove !== null} onOpenChange={(o) => { if (!o) setPendingRemove(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove activity?</DialogTitle>
            <DialogDescription>
              This will also remove all blocks using this activity. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (pendingRemove !== null) onRemove(pendingRemove)
              setPendingRemove(null)
            }}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
