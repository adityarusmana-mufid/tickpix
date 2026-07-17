import { useState, useCallback, useRef, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { save, open } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'
import { useStore } from './hooks/useStore'
import { replaceStore } from './lib/store'
import TitleBar from './components/TitleBar'
import ClockCanvas from './components/ClockCanvas'
import DaySelector from './components/DaySelector'
import ActivityPanel from './components/ActivityPanel'
import { Button } from '@/components/ui/pixelact-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/pixelact-ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { toast } from '@/components/ui/pixelact-ui/toast'

const MIN_PANEL_WIDTH = 220
const MAX_PANEL_WIDTH = 600

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
    clearAllBlocks,
    setStore,
  } = useStore()

  const [panelWidth, setPanelWidth] = useState(320)
  const [exported, setExported] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)
  const [importData, setImportData] = useState<unknown>(null)
  const resizing = useRef(false)

  const handleCreateBlock = (startHour: number, endHour: number) => {
    const activityId = store.activities.length > 0 ? store.activities[0].id : null
    addBlockToDays(store.selectedDayIndexes, startHour, endHour, activityId, null)
  }

  const handleCreateBlockFromEditor = (
    days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null
  ) => {
    addBlockToDays(days, startHour, endHour, activityId, customLabel)
  }

  const handleSelectBlock = (id: string | null) => {
    selectBlock(id)
    if (id && store.viewMode === 'view') {
      setViewMode('edit')
    }
  }

  const handleResizeStart = useCallback(() => {
    resizing.current = true
    const handleMouseMove = (e: MouseEvent) => {
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, e.clientX)))
    }
    const handleMouseUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (store.selectedBlockId) {
          selectBlock(null)
          setViewMode('view')
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setViewMode(store.viewMode === 'edit' ? 'view' : 'edit')
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const btn = document.querySelector('[data-export-btn]') as HTMLButtonElement
        btn?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store.selectedBlockId, store.viewMode, setViewMode, selectBlock])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#a4c263] overflow-hidden select-none pixel-font relative">
      <Toaster position="top-right" />
      <TitleBar />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {store.viewMode === 'edit' && (
          <ActivityPanel
            style={{ width: panelWidth }}
            activities={store.activities}
            blocks={store.blocks}
            selectedDayIndexes={store.selectedDayIndexes}
            selectedBlockId={store.selectedBlockId}
            onAddActivity={addActivity}
            onRemoveActivity={removeActivity}
            onCreateBlock={handleCreateBlockFromEditor}
            onUpdateBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onSelectBlock={selectBlock}
          />
        )}

        {store.viewMode === 'edit' && (
          <div
            className="w-1.5 cursor-col-resize bg-[#835a4d] hover:bg-[#c5996c] active:bg-[#835a4d] shrink-0"
            onMouseDown={handleResizeStart}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-[#d3e077]">
          <ClockCanvas
            blocks={store.blocks}
            activities={store.activities}
            selectedDayIndexes={store.selectedDayIndexes}
            selectedBlockId={store.selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onCreateBlock={handleCreateBlock}
          />

          <div className="flex items-center justify-center gap-2 p-1 bg-[#a4c263] border-t border-[#835a4d] shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode(store.viewMode === 'edit' ? 'view' : 'edit')}
            >
              {store.viewMode === 'edit' ? '← CLOSE' : 'EDIT'}
            </Button>
            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmClear(true)}
              >
                CLEAR ALL
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear all blocks?</DialogTitle>
                  <DialogDescription>
                    This will remove every block on every day. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { clearAllBlocks(); setConfirmClear(false) }}>
                    Clear All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="secondary"
              size="sm"
              data-export-btn=""
              onClick={async () => {
                try {
                  const path = await save({
                    filters: [{ name: 'JSON', extensions: ['json'] }],
                    defaultPath: 'tickpix-schedule.json',
                  })
                  if (!path) return
                  await writeTextFile(path, JSON.stringify(store, null, 2))
                  toast('Schedule exported')
                  setExported(true)
                  setTimeout(() => setExported(false), 1500)
                } catch {
                  toast('Export failed')
                }
              }}
            >
              {exported ? 'EXPORTED!' : 'EXPORT JSON'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  const path = await open({
                    filters: [{ name: 'JSON', extensions: ['json'] }],
                    multiple: false,
                  })
                  if (!path) return
                  const content = await readTextFile(path)
                  const parsed = JSON.parse(content)
                  setImportData(parsed)
                  setConfirmImport(true)
                } catch {
                  toast('Import failed')
                }
              }}
            >
              IMPORT JSON
            </Button>
            <Dialog open={confirmImport} onOpenChange={setConfirmImport}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import schedule?</DialogTitle>
                  <DialogDescription>
                    This will replace your current schedule with the imported one. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" size="sm" onClick={() => { setConfirmImport(false); setImportData(null) }}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    if (importData) {
                      setStore(replaceStore(importData))
                      toast('Schedule imported')
                    }
                    setConfirmImport(false)
                    setImportData(null)
                  }}>
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <DaySelector
            selected={store.selectedDayIndexes}
            onToggle={toggleDay}
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
        onMouseDown={() => getCurrentWindow().startResizeDragging('SouthEast')}
      >
        <svg viewBox="0 0 12 12" className="w-full h-full text-[#3a3028]">
          <path d="M0 12 L12 12 L12 0" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}
