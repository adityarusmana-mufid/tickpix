import { useState, useCallback, useEffect } from 'react'
import type { Block } from '../types'
import { toast } from '@/components/ui/pixelact-ui/toast'
import {
  createDefaultStore,
  saveStore,
  loadStore,
  addActivity,
  removeActivity,
  addBlockToDays,
  updateBlock,
  updateBlockInDays,
  removeBlock,
  removeBlockInDays,
  updateMission,
  addGoal,
  removeGoal,
} from '../lib/store'

export function useStore() {
  const [store, setStore] = useState(() => {
    return loadStore() ?? createDefaultStore()
  })

  useEffect(() => {
    saveStore(store)
  }, [store])

  const setViewMode = useCallback((mode: 'view' | 'edit') => {
    setStore((s) => ({ ...s, viewMode: mode }))
  }, [])

  const toggleDay = useCallback((index: number) => {
    setStore((s) => {
      const has = s.selectedDayIndexes.includes(index)
      const next = has
        ? s.selectedDayIndexes.filter((i) => i !== index)
        : [...s.selectedDayIndexes, index]
      return { ...s, selectedDayIndexes: next.length ? next : [0] }
    })
  }, [])

  const handleAddActivity = useCallback((name: string, color: string) => {
    setStore((s) => addActivity(s, name, color))
    toast('Activity added')
  }, [])

  const handleRemoveActivity = useCallback((id: string) => {
    setStore((s) => removeActivity(s, id))
    toast('Activity removed')
  }, [])

  const handleAddBlockToDays = useCallback(
    (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => {
      setStore((s) => addBlockToDays(s, days, startHour, endHour, activityId, customLabel))
      toast('Block created')
    },
    []
  )

  const handleUpdateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setStore((s) => {
      if (s.selectedDayIndexes.length > 1) return updateBlockInDays(s, id, s.selectedDayIndexes, updates)
      return updateBlock(s, id, updates)
    })
    toast('Block updated')
  }, [])

  const handleRemoveBlock = useCallback((id: string) => {
    setStore((s) => {
      if (s.selectedDayIndexes.length > 1) return removeBlockInDays(s, id, s.selectedDayIndexes)
      return removeBlock(s, id)
    })
    toast('Block removed')
  }, [])

  const selectBlock = useCallback((id: string | null) => {
    setStore((s) => ({ ...s, selectedBlockId: id }))
  }, [])

  const handleClearAllBlocks = useCallback(() => {
    setStore((s) => ({ ...s, blocks: [], selectedBlockId: null }))
    toast('All blocks cleared')
  }, [])

  const handleUpdateMission = useCallback((mission: string) => {
    setStore((s) => updateMission(s, mission))
  }, [])

  const handleAddGoal = useCallback((title: string) => {
    setStore((s) => addGoal(s, title))
    toast('Goal added')
  }, [])

  const handleRemoveGoal = useCallback((id: string) => {
    setStore((s) => removeGoal(s, id))
    toast('Goal removed')
  }, [])

  return {
    store,
    setStore,
    setViewMode,
    toggleDay,
    addActivity: handleAddActivity,
    removeActivity: handleRemoveActivity,
    addBlockToDays: handleAddBlockToDays,
    updateBlock: handleUpdateBlock,
    removeBlock: handleRemoveBlock,
    selectBlock,
    clearAllBlocks: handleClearAllBlocks,
    updateMission: handleUpdateMission,
    addGoal: handleAddGoal,
    removeGoal: handleRemoveGoal,
  }
}
