import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Block, Activity, Goal } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import ActivityList from './ActivityList'
import BlockEditor from './BlockEditor'
import ScheduleList from './ScheduleList'
import GoalsTab from './GoalsTab'

const TABS = [
  { icon: 'M4 2h16v2H4zm2 5h2v2H6zm4 0h8v2h-8zm-4 4h2v2H6zm4 0h8v2h-8zm-4 4h2v2H6zm4 0h8v2h-8zm-6 5h16v2H4zM2 4h2v16H2zm18 0h2v16h-2z', label: 'Activities' },
  { icon: 'M4 16H6V18H8V20H10V22H2V14H4V16ZM12 20H10V18H12V20ZM14 18H12V16H14V18ZM10 16H8V14H10V16ZM16 16H14V14H16V16ZM6 14H4V12H6V14ZM12 14H10V12H12V14ZM18 14H16V12H18V14ZM8 12H6V10H8V12ZM14 12H12V10H14V12ZM20 12H18V10H20V12ZM10 10H8V8H10V10ZM18 10H16V8H18V10ZM22 10H20V8H22V10ZM12 8H10V6H12V8ZM16 8H14V6H16V8ZM20 8H18V6H20V8ZM14 6H12V4H14V6ZM18 6H16V4H18V6ZM16 4H14V2H16V4Z', label: 'Block Editor' },
  { icon: 'M5 4h14v2H5zm0 16h14v2H5zM3 10h2v10H3zm0-4h2v2H3zm16 0h2v2h-2zm0 4h2v10h-2zM3 8h18v2H3zm12-6h2v2h-2zM7 2h2v2H7zm0 10h10v2H7zm0 4h10v2H7z', label: 'Schedule' },
  { icon: 'M6 2h2v2H6zm0 18h12v2H6zm12-2h2v2h-2zM4 18h2v2H4zM4 4h2v2H4zm16 10h2v4h-2zM2 6h2v12H2zm6 10h8v2H8zM6 8h2v8H6zm10 6h2v2h-2zM10 2h2v12h-2zM10 2h6v2h-6zm0 6h6v2h-6zm6-4h6v2h-6zm0 6h6v2h-6zm4-4h2v4h-2z', label: 'Goals' },
]

interface Props {
  activities: Activity[]
  blocks: Block[]
  goals: Goal[]
  mission: string
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  style?: CSSProperties
  onAddActivity: (name: string, color: string) => void
  onRemoveActivity: (id: string) => void
  onCreateBlock: (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onRemoveBlock: (id: string) => void
  onSelectBlock: (id: string | null) => void
  onUpdateMission: (mission: string) => void
  onAddGoal: (title: string) => void
  onRemoveGoal: (id: string) => void
}

export default function ActivityPanel({
  activities,
  blocks,
  goals,
  mission,
  selectedDayIndexes,
  selectedBlockId,
  style,
  onAddActivity,
  onRemoveActivity,
  onCreateBlock,
  onUpdateBlock,
  onRemoveBlock,
  onSelectBlock,
  onUpdateMission,
  onAddGoal,
  onRemoveGoal,
}: Props) {
  const [tab, setTab] = useState(0)

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null

  return (
    <div className="bg-[#a4c263] flex flex-col shrink-0" style={style}>
      <div className="flex border-b-2 border-[#835a4d] overflow-hidden">
        {TABS.map((t, i) => (
          <Button
            key={t.label}
            variant={tab === i ? 'default' : 'secondary'}
            onClick={() => setTab(i)}
            title={t.label}
            className={`flex-1 min-w-0 rounded-none border-r-2 border-[#835a4d] last:border-r-0 text-[10px] px-1.5 h-8 truncate flex items-center justify-center ${tab === i ? '!bg-[#ddb88b] !text-[#3a3028]' : '!text-[#3a3028]'}`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
              <path d={t.icon} />
            </svg>
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 0 && (
          <ActivityList activities={activities} onAdd={onAddActivity} onRemove={onRemoveActivity} />
        )}
        {tab === 1 && (
          <BlockEditor
            block={selectedBlock}
            blocks={blocks}
            activities={activities}
            selectedDayIndexes={selectedDayIndexes}
            onCreate={onCreateBlock}
            onUpdate={onUpdateBlock}
            onRemove={onRemoveBlock}
            onClose={() => onSelectBlock(null)}
          />
        )}
        {tab === 2 && (
          <ScheduleList
            blocks={blocks}
            activities={activities}
            onSelect={onSelectBlock}
            selectedId={selectedBlockId}
          />
        )}
        {tab === 3 && (
          <GoalsTab
            mission={mission}
            goals={goals}
            onUpdateMission={onUpdateMission}
            onAddGoal={onAddGoal}
            onRemoveGoal={onRemoveGoal}
          />
        )}
      </div>
    </div>
  )
}
