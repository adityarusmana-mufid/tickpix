import { useState } from 'react'
import type { Block, Activity } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'
import ActivityList from './ActivityList'
import BlockEditor from './BlockEditor'
import ScheduleList from './ScheduleList'

const TABS = ['Activities', 'Block Editor', 'Schedule']

interface Props {
  activities: Activity[]
  blocks: Block[]
  selectedDay: number
  selectedBlockId: string | null
  onAddActivity: (name: string, color: string) => void
  onRemoveActivity: (id: string) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onRemoveBlock: (id: string) => void
  onSelectBlock: (id: string | null) => void
}

export default function ActivityPanel({
  activities,
  blocks,
  selectedDay,
  selectedBlockId,
  onAddActivity,
  onRemoveActivity,
  onUpdateBlock,
  onRemoveBlock,
  onSelectBlock,
}: Props) {
  const [tab, setTab] = useState(0)

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null

  return (
    <div className="w-64 bg-[#0f0f1a] border-r-2 border-[#2a2a3e] flex flex-col shrink-0">
      <div className="flex border-b-2 border-[#2a2a3e]">
        {TABS.map((t, i) => (
          <Button
            key={t}
            variant={tab === i ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setTab(i)}
            className={`flex-1 rounded-none border-r-2 border-[#2a2a3e] last:border-r-0 ${tab === i ? '!bg-white !text-black' : '!text-[#808090]'}`}
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
            activities={activities}
            onUpdate={onUpdateBlock}
            onRemove={onRemoveBlock}
            onClose={() => onSelectBlock(null)}
          />
        )}
        {tab === 2 && (
          <ScheduleList
            blocks={blocks.filter((b) => b.dayOfWeek === selectedDay)}
            activities={activities}
            onSelect={onSelectBlock}
            selectedId={selectedBlockId}
          />
        )}
      </div>
    </div>
  )
}
