import { useState, useEffect } from 'react'
import type { Block, Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/pixelact-ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/pixelact-ui/select'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  block: Block | null
  blocks: Block[]
  activities: Activity[]
  selectedDayIndexes: number[]
  onCreate: (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => void
  onUpdate: (id: string, updates: Partial<Block>) => void
  onRemove: (id: string) => void
  onClose: () => void
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function BlockEditor({ block, blocks, activities, selectedDayIndexes, onCreate, onUpdate, onRemove, onClose }: Props) {
  const [customText, setCustomText] = useState('')
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(10)
  const [createDays, setCreateDays] = useState<number[]>(selectedDayIndexes)
  const [createActivityId, setCreateActivityId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingToggleDay, setPendingToggleDay] = useState<number | null>(null)

  useEffect(() => {
    if (block) {
      setCustomText(block.customLabel ?? '')
      setStartHour(block.startHour)
      setEndHour(block.endHour)
    } else {
      setStartHour(9)
      setEndHour(10)
      setCreateDays(selectedDayIndexes)
      setCustomText('')
      setCreateActivityId(null)
    }
  }, [block, selectedDayIndexes])

  if (!block) {
    return (
      <div className="p-3 space-y-3">
        <span className="block text-xs font-pixel text-[#3a3028] mb-2">New Block</span>

        <div>
          <span className="block text-xs font-pixel text-[#3a3028] mb-1">Days</span>
          <div className="flex flex-wrap gap-1">
            {DAYS.map((day, i) => {
              const active = createDays.includes(i)
              return (
                <Button
                  key={day}
                  variant={active ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setCreateDays((d) =>
                      active ? d.filter((x) => x !== i) : [...d, i]
                    )
                  }}
                  className={active ? '!bg-[#ddb88b] !text-[#3a3028]' : ''}
                >
                  {day}
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs font-pixel text-[#3a3028] mb-1">Time</span>
          <div className="flex items-center gap-2">
            <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
              <SelectTrigger className="text-xs font-pixel flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-pixel">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs font-pixel text-[#3a3028]">–</span>
            <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
              <SelectTrigger className="text-xs font-pixel flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-pixel">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Select
          value={createActivityId ?? ''}
          onValueChange={(val) => setCreateActivityId(val || null)}
        >
          <SelectTrigger className="text-xs font-pixel">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent className="font-pixel">
            <SelectItem value="">Unassigned</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none focus:border-[#835a4d]"
          placeholder="Custom label..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
        />

        <Button
          variant="default"
          size="sm"
          className="w-full"
          disabled={createDays.length === 0}
          onClick={() => {
            if (createDays.length === 0) return
            onCreate(createDays, startHour, endHour, createActivityId, customText || null)
            onClose()
          }}
        >
          CREATE
        </Button>
      </div>
    )
  }

  const siblingDays = [...new Set(
    blocks
      .filter((b) => b.startHour === block.startHour && b.endHour === block.endHour && b.activityId === block.activityId)
      .map((b) => b.dayOfWeek)
  )]

  const toggleDay = (day: number) => {
    if (siblingDays.includes(day)) {
      setPendingToggleDay(day)
    } else {
      onCreate([day], block.startHour, block.endHour, block.activityId, block.customLabel)
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-pixel text-[#3a3028]">Edit Block</span>
        <Button variant="link" size="sm" onClick={onClose}>×</Button>
      </div>

      <div className="bg-[#c5996c] border-2 border-[#835a4d] p-2 space-y-1">
        <div className="flex items-center gap-2">
          {(() => {
            const activity = activities.find((a) => a.id === block.activityId)
            return activity ? (
              <>
                <div className="w-3 h-3 border-2 border-[#835a4d]" style={{ backgroundColor: activity.color }} />
                <span className="text-xs font-pixel text-[#3a3028]">{activity.name}</span>
              </>
            ) : (
              <span className="text-xs font-pixel text-[#3a3028]">Unassigned</span>
            )
          })()}
          <span className="text-xs font-pixel text-[#3a3028]">
            {formatHour(block.startHour)} – {formatHour(block.endHour)}
          </span>
        </div>
        <div className="text-xs font-pixel text-[#3a3028]">
          {siblingDays.length === 7 ? 'Every day' : siblingDays.map(i => DAYS[i]).join(', ')}
        </div>
      </div>

      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Days</span>
        <div className="flex flex-wrap gap-1">
          {DAYS.map((day, i) => {
            const active = siblingDays.includes(i)
            return (
              <Button
                key={day}
                variant={active ? 'default' : 'secondary'}
                size="sm"
                onClick={() => toggleDay(i)}
                className={active ? '!bg-[#ddb88b] !text-[#3a3028]' : ''}
              >
                {day}
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Time</span>
        <div className="flex items-center gap-2">
          <Select value={String(startHour)} onValueChange={(v) => {
            const val = Number(v)
            setStartHour(val)
            onUpdate(block.id, { startHour: val })
          }}>
            <SelectTrigger className="text-xs font-pixel flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-pixel">
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs font-pixel text-[#3a3028]">–</span>
          <Select value={String(endHour)} onValueChange={(v) => {
            const val = Number(v)
            setEndHour(val)
            onUpdate(block.id, { endHour: val })
          }}>
            <SelectTrigger className="text-xs font-pixel flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-pixel">
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none focus:border-[#835a4d]"
          placeholder="Custom label..."
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value)
            onUpdate(block.id, { customLabel: e.target.value || null })
          }}
        />
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <Button variant="destructive" size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
          DELETE
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this block?</DialogTitle>
            <DialogDescription>This will remove this block from this day.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { onRemove(block.id); onClose() }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingToggleDay !== null} onOpenChange={(o) => { if (!o) setPendingToggleDay(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this day?</DialogTitle>
            <DialogDescription>This will remove the block from this day.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setPendingToggleDay(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (pendingToggleDay === null) return
              const day = pendingToggleDay
              const sibling = blocks.find(
                (b) => b.dayOfWeek === day && b.startHour === block.startHour && b.endHour === block.endHour && b.activityId === block.activityId
              )
              if (sibling) onRemove(sibling.id)
              setPendingToggleDay(null)
            }}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
