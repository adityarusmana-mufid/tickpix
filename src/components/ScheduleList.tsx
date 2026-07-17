import type { Block, Activity } from '../types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
  const sigGroups = new Map<string, { days: Set<number>; blocks: Block[] }>()
  for (const b of blocks) {
    const k = `${b.startHour}|${b.endHour}|${b.activityId}|${b.customLabel}`
    let g = sigGroups.get(k)
    if (!g) {
      g = { days: new Set(), blocks: [] }
      sigGroups.set(k, g)
    }
    g.days.add(b.dayOfWeek)
    g.blocks.push(b)
  }

  const daySets = new Map<string, { days: Set<number>; sigItems: { label: string; color: string; hour: string; blocks: Block[] }[] }>()
  for (const [sk, sg] of sigGroups) {
    const dk = [...sg.days].sort().join('|')
    let ds = daySets.get(dk)
    if (!ds) {
      ds = { days: new Set(sg.days), sigItems: [] }
      daySets.set(dk, ds)
    }
    const first = [...sg.blocks].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0]
    const activity = activities.find((a) => a.id === first.activityId)
    ds.sigItems.push({
      label: activity?.name ?? first.customLabel ?? 'Untitled',
      color: activity?.color ?? '#0f380f',
      hour: `${formatHour(first.startHour)}–${formatHour(first.endHour)}`,
      blocks: sg.blocks,
    })
  }

  const sortedDaySets = [...daySets.values()].sort((a, b) => b.days.size - a.days.size)

  return (
    <div className="p-3 space-y-3">
      {sortedDaySets.length === 0 && (
        <div className="text-xs text-[#3a3028] font-pixel text-center">No blocks</div>
      )}
      {sortedDaySets.map((ds) => {
        const dayNames = [...ds.days].sort().map((d) => DAYS[d])
        const dayList = dayNames.length === 7 ? 'Daily' : dayNames.join(', ')
        ds.sigItems.sort((a, b) => a.hour.localeCompare(b.hour))
        return (
          <div key={dayList}>
            <div className="text-[10px] font-pixel text-[#3a3028] mb-1">{dayList}</div>
            <div className="space-y-1">
              {ds.sigItems.map((si) => {
                const isSel = selectedId !== null && si.blocks.some((b) => b.id === selectedId)
                return (
                  <button
                    key={si.hour + si.label}
                    onClick={() => onSelect(si.blocks[0].id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left border text-xs font-pixel ${
                      isSel
                        ? 'bg-[#835a4d] border-[#835a4d] text-white'
                        : 'bg-[#c5996c] border-[#835a4d] text-[#3a3028] hover:bg-[#c5996c]'
                    }`}
                  >
                    <div className="w-2 h-2 shrink-0 border border-[#835a4d]" style={{ backgroundColor: si.color }} />
                    <span className="flex-1 truncate">{si.label}</span>
                    <span className="text-[#3a3028] shrink-0">{si.hour}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
