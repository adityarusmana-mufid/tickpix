import type { Block, Activity } from '../types'

interface Props {
  blocks: Block[]
  activities: Activity[]
  onSelect: (id: string) => void
  selectedId: string | null
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function ScheduleList({ blocks, activities, onSelect, selectedId }: Props) {
  const sorted = [...blocks].sort((a, b) => a.startHour - b.startHour)

  return (
    <div className="p-3 space-y-1">
      {sorted.length === 0 && (
        <div className="text-xs text-[#808090] font-pixel text-center">No blocks for this day</div>
      )}
      {sorted.map((b) => {
        const activity = activities.find((a) => a.id === b.activityId)
        const label = activity?.name ?? b.customLabel ?? 'Untitled'
        const isSelected = b.id === selectedId
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left border text-xs font-pixel ${
              isSelected
                ? 'bg-[#3a3a5e] border-[#6b6b9e] text-white'
                : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#c0c0d0] hover:bg-[#2a2a3e]'
            }`}
          >
            <div className="w-2 h-2 shrink-0 border border-[#2a2a3e]" style={{ backgroundColor: activity?.color ?? '#808080' }} />
            <span className="flex-1 truncate">{label}</span>
            <span className="text-[#808090] shrink-0">{formatHour(b.startHour)}–{formatHour(b.endHour)}</span>
          </button>
        )
      })}
    </div>
  )
}
