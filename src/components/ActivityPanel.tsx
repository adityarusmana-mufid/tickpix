import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Block, Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import ActivityList from './ActivityList'
import BlockEditor from './BlockEditor'
import ScheduleList from './ScheduleList'

const TABS = ['Activities', 'Block Editor', 'Schedule']

interface Props {
  activities: Activity[]
  blocks: Block[]
  selectedDayIndexes: number[]
  selectedBlockId: string | null
  style?: CSSProperties
  onAddActivity: (name: string, color: string) => void
  onRemoveActivity: (id: string) => void
  onCreateBlock: (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onRemoveBlock: (id: string) => void
  onSelectBlock: (id: string | null) => void
}

export default function ActivityPanel({
  activities,
  blocks,
  selectedDayIndexes,
  selectedBlockId,
  style,
  onAddActivity,
  onRemoveActivity,
  onCreateBlock,
  onUpdateBlock,
  onRemoveBlock,
  onSelectBlock,
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
            key={t}
            variant={tab === i ? 'default' : 'secondary'}
            onClick={() => setTab(i)}
            className={`flex-1 min-w-0 rounded-none border-r-2 border-[#835a4d] last:border-r-0 text-[10px] px-1.5 h-8 truncate ${tab === i ? '!bg-[#ddb88b] !text-[#3a3028]' : '!text-[#3a3028]'}`}
          >
            {t}
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
      </div>
    </div>
  )
}
