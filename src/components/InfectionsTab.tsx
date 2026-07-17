import { useState } from 'react'
import type { Block, Activity, Infection } from '../types'
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
  infections: Infection[]
  onAddInfection: (infection: Omit<Infection, 'id'>) => void
  onUpdateInfection: (id: string, updates: Partial<Infection>) => void
  onRemoveInfection: (id: string) => void
}

function signatureKey(b: Block): string {
  return `${b.activityId}|${b.startHour}|${b.endHour}|${b.customLabel}`
}

function signatureLabel(b: Block, activities: Activity[]): string {
  const a = activities.find((act) => act.id === b.activityId)
  const name = a?.name ?? 'Unassigned'
  return `${name} (${b.startHour}–${b.endHour})`
}

export default function InfectionsTab({ blocks, activities, infections, onAddInfection, onUpdateInfection, onRemoveInfection }: Props) {
  const sigs = blocks.reduce<Block[]>((acc, b) => {
    if (!acc.some((x) => signatureKey(x) === signatureKey(b))) acc.push(b)
    return acc
  }, [])

  const [selSig, setSelSig] = useState<string>('')
  const [selAct, setSelAct] = useState(activities[0]?.id ?? '')
  const [pct, setPct] = useState(30)

  const handleAdd = () => {
    const sig = sigs.find((b) => signatureKey(b) === selSig)
    if (!sig || !selAct) return
    onAddInfection({
      activityId: selAct,
      blockActivityId: sig.activityId,
      blockStartHour: sig.startHour,
      blockEndHour: sig.endHour,
      blockCustomLabel: sig.customLabel,
      percentage: pct,
    })
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Add Infection</span>
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
          <Button variant="default" size="sm" onClick={handleAdd} disabled={!selSig || !selAct}>
            Add
          </Button>
        </div>
      </div>

      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Configured Infections</span>
        {infections.length === 0 && (
          <div className="text-xs font-pixel text-[#3a3028]">No infections configured.</div>
        )}
        <div className="space-y-1">
          {infections.map((inf) => {
            const sig = sigs.find(
              (b) =>
                b.activityId === inf.blockActivityId &&
                b.startHour === inf.blockStartHour &&
                b.endHour === inf.blockEndHour &&
                b.customLabel === inf.blockCustomLabel
            )
            const infAct = activities.find((a) => a.id === inf.activityId)
            return (
              <div key={inf.id} className="w-full flex items-center gap-2 px-2 py-1.5 bg-[#c5996c] border border-[#835a4d] text-xs font-pixel text-[#3a3028]">
                <div className="w-2 h-2 shrink-0 border border-[#835a4d]" style={{ backgroundColor: infAct?.color ?? '#835a4d' }} />
                <span className="flex-1 truncate">
                  {sig ? signatureLabel(sig, activities) : 'Unknown'} → {infAct?.name ?? '?'}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inf.percentage}
                  onChange={(e) => onUpdateInfection(inf.id, { percentage: Number(e.target.value) })}
                  className="w-16"
                />
                <span className="w-6 text-right">{inf.percentage}%</span>
                <button
                  className="hover:opacity-70 px-1"
                  onClick={() => onRemoveInfection(inf.id)}
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
