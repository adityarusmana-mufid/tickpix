import { useState } from 'react'
import type { Goal } from '../types'
import { Button } from '@/components/ui/pixelact-ui/button'

interface Props {
  mission: string
  goals: Goal[]
  onUpdateMission: (mission: string) => void
  onAddGoal: (title: string) => void
  onRemoveGoal: (id: string) => void
}

export default function GoalsTab({ mission, goals, onUpdateMission, onAddGoal, onRemoveGoal }: Props) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const t = input.trim()
    if (!t) return
    onAddGoal(t)
    setInput('')
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Mission</span>
        <textarea
          className="w-full h-20 px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none resize-none focus:border-[#835a4d]"
          value={mission}
          onChange={(e) => onUpdateMission(e.target.value)}
          placeholder="What do you hope to achieve by following this schedule?"
        />
      </div>

      <div>
        <span className="block text-xs font-pixel text-[#3a3028] mb-1">Goals</span>
        <div className="flex gap-1 mb-2">
          <input
            className="flex-1 px-2 py-1 text-xs bg-[#c5996c] border-2 border-[#835a4d] text-[#3a3028] font-pixel outline-none focus:border-[#835a4d]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="Add a goal..."
          />
          <Button variant="default" size="sm" onClick={handleAdd}>Add</Button>
        </div>
        {goals.length === 0 && (
          <div className="text-xs font-pixel text-[#3a3028]">No goals yet.</div>
        )}
        {goals.map((g) => (
          <div key={g.id} className="flex items-center justify-between py-1 border-b border-[#835a4d] last:border-b-0">
            <span className="text-xs font-pixel text-[#3a3028]">{g.title}</span>
            <button
              className="text-xs font-pixel text-[#3a3028] hover:text-[#3a3028] px-1"
              onClick={() => onRemoveGoal(g.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
