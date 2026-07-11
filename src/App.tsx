import { useStore } from './hooks/useStore'
import TitleBar from './components/TitleBar'
import ClockCanvas from './components/ClockCanvas'
import DaySelector from './components/DaySelector'
import ActivityPanel from './components/ActivityPanel'
import { Button } from '@/components/ui/pixelact-ui/button'
import { getBlocksForDay } from './lib/store'

export default function App() {
  const {
    store,
    setViewMode,
    toggleDay,
    addActivity,
    removeActivity,
    addBlockToDays,
    updateBlock,
    removeBlock,
    selectBlock,
  } = useStore()

  const selectedDay = store.selectedDayIndexes[0] ?? 0
  const dayBlocks = getBlocksForDay(store, selectedDay)

  const handleCreateBlock = (startHour: number, endHour: number) => {
    const activityId = store.activities.length > 0 ? store.activities[0].id : null
    addBlockToDays(store.selectedDayIndexes, startHour, endHour, activityId, null)
  }

  const handleSelectBlock = (id: string | null) => {
    selectBlock(id)
    if (id && store.viewMode === 'view') {
      setViewMode('edit')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f0f1a] overflow-hidden select-none pixel-font">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {store.viewMode === 'edit' && (
          <ActivityPanel
            activities={store.activities}
            blocks={store.blocks}
            selectedDay={selectedDay}
            selectedBlockId={store.selectedBlockId}
            onAddActivity={addActivity}
            onRemoveActivity={removeActivity}
            onUpdateBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onSelectBlock={selectBlock}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <ClockCanvas
            blocks={store.blocks}
            activities={store.activities}
            selectedDay={selectedDay}
            selectedBlockId={store.selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onCreateBlock={handleCreateBlock}
          />

          <div className="flex items-center justify-center gap-2 p-1 bg-[#0f0f1a] border-t border-[#2a2a3e] shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode(store.viewMode === 'edit' ? 'view' : 'edit')}
            >
              {store.viewMode === 'edit' ? '← CLOSE' : 'EDIT'}
            </Button>
          </div>

          <DaySelector
            selected={store.selectedDayIndexes}
            onToggle={toggleDay}
          />
        </div>
      </div>
    </div>
  )
}
