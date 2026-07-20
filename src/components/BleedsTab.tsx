import { useState } from 'react'
import type { Block, Activity, Bleed } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/pixelact-ui/select'

interface Props {
  blocks: Block[]
  activities: Activity[]
  bleeds: Bleed[]
  onAddBleed: (bleed: Omit<Bleed, 'id'>) => void
  onUpdateBleed: (id: string, updates: Partial<Bleed>) => void
  onRemoveBleed: (id: string) => void
}

function signatureKey(b: Block): string {
  return `${b.activityId}|${b.startHour}|${b.endHour}|${b.customLabel}`
}

function signatureLabel(b: Block, activities: Activity[]): string {
  const a = activities.find((act) => act.id === b.activityId)
  const name = a?.name ?? 'Unassigned'
  return `${name} (${b.startHour}–${b.endHour})`
}

export default function BleedsTab({ blocks, activities, bleeds, onAddBleed, onUpdateBleed, onRemoveBleed }: Props) {
  const sigs = blocks.reduce<Block[]>((acc, b) => {
    if (!acc.some((x) => signatureKey(x) === signatureKey(b))) acc.push(b)
    return acc
  }, [])

  const [selSig, setSelSig] = useState<string>('')
  const [selAct, setSelAct] = useState(activities[0]?.id ?? '')
  const [customName, setCustomName] = useState('')
  const [pct, setPct] = useState(30)

  const handleAdd = () => {
    const sig = sigs.find((b) => signatureKey(b) === selSig)
    if (!sig) return
    if (!selAct && !customName.trim()) return
    onAddBleed({
      activityId: selAct || null,
      customName: customName.trim() || null,
      blockActivityId: sig.activityId,
      blockStartHour: sig.startHour,
      blockEndHour: sig.endHour,
      blockCustomLabel: sig.customLabel,
      percentage: pct,
    })
    setCustomName('')
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Add Bleed</span>
        <div className="flex flex-col gap-1.5">
          <Select value={selSig} onValueChange={setSelSig}>
            <SelectTrigger className="text-xs font-pixel">
              <SelectValue placeholder="Select block..." />
            </SelectTrigger>
            <SelectContent className="font-pixel">
              {sigs.map((s) => (
                <SelectItem key={signatureKey(s)} value={signatureKey(s)}>{signatureLabel(s, activities)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selAct} onValueChange={setSelAct}>
            <SelectTrigger className="text-xs font-pixel">
              <SelectValue placeholder="Select activity..." />
            </SelectTrigger>
            <SelectContent className="font-pixel">
              {activities.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none placeholder:text-[#3a3028]/60"
            placeholder="Custom bleed name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-pixel text-[#3a3028] w-8 text-right">{pct}%</span>
          </div>
          <Button variant="default" size="sm" onClick={handleAdd} disabled={!selSig || (!selAct && !customName.trim())}>
            Add
          </Button>
        </div>
      </div>

      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Configured Bleeds</span>
        {bleeds.length === 0 && (
          <div className="text-xs font-pixel text-[#3a3028]">No bleeds configured.</div>
        )}
        <div className="space-y-1">
          {bleeds.map((bl) => {
            const sig = sigs.find(
              (b) =>
                b.activityId === bl.blockActivityId &&
                b.startHour === bl.blockStartHour &&
                b.endHour === bl.blockEndHour &&
                b.customLabel === bl.blockCustomLabel
            )
            const blAct = activities.find((a) => a.id === bl.activityId)
            const blName = bl.customName ?? blAct?.name ?? '?'
            return (
              <div key={bl.id} className="w-full flex items-center gap-2 px-2 py-1.5 bg-[#c5996c] border border-[#835a4d] text-xs font-pixel text-[#3a3028]">
                <div className="w-2 h-2 shrink-0 border border-[#835a4d]" style={{ backgroundColor: blAct?.color ?? '#835a4d' }} />
                <span className="flex-1 truncate">
                  {sig ? signatureLabel(sig, activities) : 'Unknown'} → {blName}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bl.percentage}
                  onChange={(e) => onUpdateBleed(bl.id, { percentage: Number(e.target.value) })}
                  className="w-16"
                />
                <span className="w-6 text-right">{bl.percentage}%</span>
                <button
                  className="hover:opacity-70 px-1"
                  onClick={() => onRemoveBleed(bl.id)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
