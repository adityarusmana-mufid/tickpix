import { useState } from 'react'
import type { Block, Activity, Infection } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'

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
          <select
            className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none"
            value={selSig}
            onChange={(e) => setSelSig(e.target.value)}
          >
            <option value="">Select block...</option>
            {sigs.map((s) => (
              <option key={signatureKey(s)} value={signatureKey(s)}>{signatureLabel(s, activities)}</option>
            ))}
          </select>
          <select
            className="w-full px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none"
            value={selAct}
            onChange={(e) => setSelAct(e.target.value)}
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
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
            <div key={inf.id} className="flex items-center gap-1 py-1.5 border-b border-[#835a4d] last:border-b-0 flex-wrap">
              <span className="text-[10px] font-pixel text-[#3a3028] flex-1 min-w-[80px]">
                {sig ? signatureLabel(sig, activities) : 'Unknown'}
              </span>
              <span className="text-[10px] font-pixel text-[#3a3028]">→</span>
              <span className="text-[10px] font-pixel text-[#3a3028]" style={{ color: infAct?.color }}>
                {infAct?.name ?? '?'}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={inf.percentage}
                onChange={(e) => onUpdateInfection(inf.id, { percentage: Number(e.target.value) })}
                className="w-16"
              />
              <span className="text-[10px] font-pixel text-[#3a3028] w-6 text-right">{inf.percentage}%</span>
              <button
                className="text-xs font-pixel text-[#3a3028] hover:text-[#3a3028] px-1"
                onClick={() => onRemoveInfection(inf.id)}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
