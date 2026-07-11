import { useState, useCallback, useEffect } from 'react'
import type { Block } from '../types'
import {
  createDefaultStore,
  saveStore,
  loadStore,
  addActivity,
  removeActivity,
  addBlockToDays,
  updateBlock,
  removeBlock,
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
  }, [])

  const handleRemoveActivity = useCallback((id: string) => {
    setStore((s) => removeActivity(s, id))
  }, [])

  const handleAddBlockToDays = useCallback(
    (days: number[], startHour: number, endHour: number, activityId: string | null, customLabel: string | null) => {
      setStore((s) => addBlockToDays(s, days, startHour, endHour, activityId, customLabel))
    },
    []
  )

  const handleUpdateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setStore((s) => updateBlock(s, id, updates))
  }, [])

  const handleRemoveBlock = useCallback((id: string) => {
    setStore((s) => removeBlock(s, id))
  }, [])

  const selectBlock = useCallback((id: string | null) => {
    setStore((s) => ({ ...s, selectedBlockId: id }))
  }, [])

  return {
    store,
    setViewMode,
    toggleDay,
    addActivity: handleAddActivity,
    removeActivity: handleRemoveActivity,
    addBlockToDays: handleAddBlockToDays,
    updateBlock: handleUpdateBlock,
    removeBlock: handleRemoveBlock,
    selectBlock,
  }
}
